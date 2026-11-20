import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // In-memory server tracking for verified transactions to prevent double-crediting
  const confirmedTransactions = new Set<string>();

  // In-memory admin settings (stored and managed on the server)
  let adminSettings = {
    exchangeRateKshPerUsd: 130, // 1 USD = 130 KES
    biddingPassFeeKsh: 850, // KSH 850 for 24 hours
    biddingPassDurationHours: 24,
    maxUnlocksPerListing: 30, // Maximum 30 unlocks per listing
    holdDurationSeconds: 120, // ~2 minutes slot hold during M-Pesa STK prompt
    tiers: [
      { id: 'tier_1', minUsd: 0, maxUsd: 2000, feeKsh: 120, label: 'Under USD 2,000: KSH 120' },
      { id: 'tier_2', minUsd: 2000, maxUsd: 5000, feeKsh: 300, label: 'USD 2,000 to 4,999: KSH 300' },
      { id: 'tier_3', minUsd: 5000, maxUsd: 10000, feeKsh: 600, label: 'USD 5,000 to 9,999: KSH 600' },
      { id: 'tier_4', minUsd: 10000, maxUsd: 20000, feeKsh: 1200, label: 'USD 10,000 to 19,999: KSH 1,200' },
      { id: 'tier_5', minUsd: 20000, maxUsd: 50000, feeKsh: 2500, label: 'USD 20,000 to 49,999: KSH 2,500' },
      { id: 'tier_6', minUsd: 50000, maxUsd: Infinity, feeKsh: 5000, label: 'USD 50,000 and above: KSH 5,000' },
    ],
  };

  // Helper to calculate tier fee from budget in USD
  function calculateUnlockFee(budgetUsd: number): { feeKsh: number; tierLabel: string } {
    if (budgetUsd < 2000) return { feeKsh: 120, tierLabel: 'Under USD 2,000: KSH 120' };
    if (budgetUsd < 5000) return { feeKsh: 300, tierLabel: 'USD 2,000 to 4,999: KSH 300' };
    if (budgetUsd < 10000) return { feeKsh: 600, tierLabel: 'USD 5,000 to 9,999: KSH 600' };
    if (budgetUsd < 20000) return { feeKsh: 1200, tierLabel: 'USD 10,000 to 19,999: KSH 1,200' };
    if (budgetUsd < 50000) return { feeKsh: 2500, tierLabel: 'USD 20,000 to 49,999: KSH 2,500' };
    return { feeKsh: 5000, tierLabel: 'USD 50,000 and above: KSH 5,000' };
  }

  interface ServerHold {
    id: string;
    request_id: string;
    operator_id: string;
    fee_ksh: number;
    tier: string;
    held_until: number; // timestamp ms
  }

  interface ServerUnlockRecord {
    id: string;
    request_id: string;
    operator_id: string;
    tier: string;
    fee_ksh: number;
    status: 'paid' | 'failed' | 'refunded';
    paid_at: string;
    mpesa_transaction_id: string;
  }

  interface ServerPaymentRecord {
    id: string;
    operator_id: string;
    type: 'pass' | 'unlock';
    request_id: string | null;
    request_title?: string;
    amount_ksh: number;
    mpesa_transaction_id: string;
    status: 'completed' | 'failed';
    failure_reason?: string;
    paid_at: string;
    pass_expires_at?: string | null;
  }

  // Active holds and server unlock store
  const activeHolds = new Map<string, ServerHold>();
  const serverUnlocks = new Map<string, ServerUnlockRecord>(); // key: `${request_id}_${operator_id}`
  const serverPayments: ServerPaymentRecord[] = [];

  // Seed default unlocks for demonstration
  serverUnlocks.set('req_1_op_1', {
    id: 'unl_seed_1',
    request_id: 'req_1',
    operator_id: 'op_1',
    tier: 'USD 2,000 to 4,999: KSH 300',
    fee_ksh: 300,
    status: 'paid',
    paid_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    mpesa_transaction_id: 'QHK82937XJ',
  });

  // Seed initial completed unlocks for req_3 (already reached 30 unlocks) to demonstrate "Contacts full"
  for (let i = 1; i <= 30; i++) {
    serverUnlocks.set(`req_3_mock_op_${i}`, {
      id: `unl_seed_req3_${i}`,
      request_id: 'req_3',
      operator_id: `mock_op_${i}`,
      tier: 'Under USD 2,000: KSH 120',
      fee_ksh: 120,
      status: 'paid',
      paid_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      mpesa_transaction_id: `SEDRQ${10000 + i}`,
    });
  }

  function cleanExpiredHolds() {
    const now = Date.now();
    for (const [holdId, hold] of activeHolds.entries()) {
      if (hold.held_until < now) {
        activeHolds.delete(holdId);
      }
    }
  }

  function getRequestUnlockStats(requestId: string) {
    cleanExpiredHolds();
    let paidCount = 0;
    for (const unlock of serverUnlocks.values()) {
      if (unlock.request_id === requestId && unlock.status === 'paid') {
        paidCount++;
      }
    }
    let heldCount = 0;
    for (const hold of activeHolds.values()) {
      if (hold.request_id === requestId) {
        heldCount++;
      }
    }
    const maxUnlocks = adminSettings.maxUnlocksPerListing;
    const remaining = Math.max(0, maxUnlocks - paidCount);
    return {
      paidCount,
      heldCount,
      total: maxUnlocks,
      remaining,
      isFull: paidCount >= maxUnlocks,
    };
  }

  // API: Get Admin Marketplace Settings
  app.get('/api/settings', (_req: Request, res: Response) => {
    res.json(adminSettings);
  });

  // API: Update Admin Marketplace Settings
  app.post('/api/settings', (req: Request, res: Response) => {
    try {
      const updates = req.body;
      adminSettings = { ...adminSettings, ...updates };
      res.json({ success: true, settings: adminSettings });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // API: Get unlock stats for a listing (counts completed payments, not clicks)
  app.get('/api/requests/:id/unlock-status', (req: Request, res: Response) => {
    const { id } = req.params;
    const stats = getRequestUnlockStats(id);
    res.json(stats);
  });

  // API 1: Verify 24-hour bidding pass on server (true server-authoritative check)
  app.post('/api/pass/verify', (req: Request, res: Response) => {
    try {
      const { operator_id, access_expires_at, bidding_pass_expires_at } = req.body;
      const expiry = bidding_pass_expires_at || access_expires_at;
      const now = Date.now();

      if (!expiry) {
        return res.json({
          active: false,
          hoursRemaining: 0,
          minutesRemaining: 0,
          isEndingSoon: false,
          label: 'No active pass',
          serverTime: new Date(now).toISOString(),
          expiresAt: null,
        });
      }

      const expiryTime = new Date(expiry).getTime();
      const diffMs = expiryTime - now;

      if (diffMs <= 0) {
        return res.json({
          active: false,
          hoursRemaining: 0,
          minutesRemaining: 0,
          isEndingSoon: false,
          label: 'No active pass',
          serverTime: new Date(now).toISOString(),
          expiresAt: expiry,
        });
      }

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const isEndingSoon = hours <= 3; // Rule: At 3 hours or fewer, turn amber and show Ending soon tag

      return res.json({
        active: true,
        hoursRemaining: hours,
        minutesRemaining: minutes,
        isEndingSoon,
        label: hours >= 1 ? `${hours} hours left` : `${minutes} minutes left`,
        serverTime: new Date(now).toISOString(),
        expiresAt: expiry,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to verify pass' });
    }
  });

  // API 2: Hold a contact unlock slot for ~2 minutes while M-Pesa prompt is open
  app.post('/api/unlock/hold', (req: Request, res: Response) => {
    try {
      const {
        operator_id,
        request_id,
        budget_usd = 2000,
        request_status = 'open',
        bids_only = false,
        is_profile_complete = true,
      } = req.body;

      if (!operator_id || !request_id) {
        return res.status(400).json({ success: false, message: 'operator_id and request_id are required' });
      }

      // Enforce Profile Gate: operator must complete private profile before unlocking
      if (!is_profile_complete) {
        return res.status(403).json({
          success: false,
          message: 'Create your profile to start unlocking contacts. Your profile is private.',
        });
      }

      // Rule: When the traveler closes the enquiry, bids and unlocks both stop.
      if (request_status === 'closed' || request_status === 'expired') {
        return res.status(400).json({
          success: false,
          message: 'This enquiry is closed. Bids and unlocks are closed for this listing.',
        });
      }

      // Rule: A traveler can turn unlocking off for their request ("bids only").
      if (bids_only) {
        return res.status(400).json({
          success: false,
          message: 'The traveler has designated this request as "Bids only". Contact unlocking is not permitted.',
        });
      }

      // Check if already unlocked
      const existingUnlock = serverUnlocks.get(`${request_id}_${operator_id}`);
      if (existingUnlock && existingUnlock.status === 'paid') {
        return res.status(409).json({
          success: false,
          message: 'Contact already unlocked for this listing.',
        });
      }

      // Enforce 30 unlocks limit (completed payments + active holds)
      const stats = getRequestUnlockStats(request_id);
      if (stats.paidCount >= adminSettings.maxUnlocksPerListing) {
        return res.status(400).json({
          success: false,
          message: 'Contacts full (maximum 30 unlocks reached for this listing).',
        });
      }

      const { feeKsh, tierLabel } = calculateUnlockFee(Number(budget_usd));
      const holdId = `hld_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const heldUntil = Date.now() + adminSettings.holdDurationSeconds * 1000;

      const newHold: ServerHold = {
        id: holdId,
        request_id,
        operator_id,
        fee_ksh: feeKsh,
        tier: tierLabel,
        held_until: heldUntil,
      };

      activeHolds.set(holdId, newHold);

      return res.json({
        success: true,
        hold_id: holdId,
        fee_ksh: feeKsh,
        tier: tierLabel,
        held_until: new Date(heldUntil).toISOString(),
        duration_seconds: adminSettings.holdDurationSeconds,
        message: `Slot held for 2 minutes. Please complete payment of KSH ${feeKsh} via M-Pesa prompt.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Hold creation error' });
    }
  });

  // API 3: Cancel or release an active hold (e.g. user dismissed prompt or prompt timed out)
  app.post('/api/unlock/cancel', (req: Request, res: Response) => {
    try {
      const { hold_id, operator_id, request_id, reason } = req.body;
      if (hold_id && activeHolds.has(hold_id)) {
        activeHolds.delete(hold_id);
      }

      // Keep record of failed attempt
      const randomPrefix = ['FLX', 'QHK', 'RJK'][Math.floor(Math.random() * 3)];
      const failedTxId = `${randomPrefix}${Math.floor(1000000 + Math.random() * 9000000).toString().substring(0, 7)}`;
      
      serverPayments.push({
        id: `pay_fail_${Date.now()}`,
        operator_id: operator_id || 'unknown',
        type: 'unlock',
        request_id: request_id || null,
        amount_ksh: 0,
        mpesa_transaction_id: failedTxId,
        status: 'failed',
        failure_reason: reason || 'M-Pesa payment prompt cancelled or timed out. Not charged.',
        paid_at: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: 'Slot hold released. Attempt logged as not charged.',
        notCharged: true,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API 4: Confirm Unlock Payment (M-Pesa STK Callback simulation)
  app.post('/api/unlock/confirm', (req: Request, res: Response) => {
    try {
      const {
        hold_id,
        request_id,
        operator_id,
        phone_number = '0722456789',
        request_title = 'Travel Request',
        request_category = 'safari',
        budget_usd = 2000,
        simulate_failure = false,
        simulate_late_payment_full = false, // simulates confirming after hold expired when listing reached 30/30
      } = req.body;

      if (!operator_id || !request_id) {
        return res.status(400).json({ success: false, message: 'Missing operator_id or request_id' });
      }

      const { feeKsh, tierLabel } = calculateUnlockFee(Number(budget_usd));
      const prefix = ['QHK', 'RJK', 'SMT', 'TLP', 'UKW', 'VMN'][Math.floor(Math.random() * 6)];
      const randomSuffix = Math.floor(1000000 + Math.random() * 9000000).toString();
      const transactionId = `${prefix}${randomSuffix.substring(0, 7)}`;

      // Simulate failed user prompt
      if (simulate_failure) {
        if (hold_id) activeHolds.delete(hold_id);

        const failedPayment: ServerPaymentRecord = {
          id: `pay_fail_${Date.now()}`,
          operator_id,
          type: 'unlock',
          request_id,
          request_title,
          amount_ksh: feeKsh,
          mpesa_transaction_id: transactionId,
          status: 'failed',
          failure_reason: 'User cancelled M-Pesa PIN prompt or request timed out',
          paid_at: new Date().toISOString(),
        };
        serverPayments.push(failedPayment);

        return res.json({
          success: false,
          status: 'failed',
          notCharged: true,
          transactionId,
          amount_ksh: feeKsh,
          failureReason: 'User cancelled M-Pesa PIN prompt or request timed out',
          message: 'M-Pesa payment attempt was cancelled. Not charged.',
          timestamp: new Date().toISOString(),
        });
      }

      // Check hold status & listing capacity
      cleanExpiredHolds();
      const stats = getRequestUnlockStats(request_id);

      // Rule: If a payment confirms after the hold expired and the listing is already full,
      // refund it automatically and tell the operator.
      const hold = hold_id ? activeHolds.get(hold_id) : null;
      const isHoldExpired = !hold || hold.held_until < Date.now();

      if ((isHoldExpired && stats.paidCount >= adminSettings.maxUnlocksPerListing) || simulate_late_payment_full) {
        if (hold_id) activeHolds.delete(hold_id);

        // Record refund
        serverPayments.push({
          id: `pay_ref_${Date.now()}`,
          operator_id,
          type: 'unlock',
          request_id,
          request_title,
          amount_ksh: feeKsh,
          mpesa_transaction_id: transactionId,
          status: 'failed',
          failure_reason: 'Listing reached 30 unlocks before payment confirmed. KSH ' + feeKsh + ' automatically refunded.',
          paid_at: new Date().toISOString(),
        });

        return res.json({
          success: false,
          refunded: true,
          status: 'refunded',
          transactionId,
          amount_ksh: feeKsh,
          message: `Payment confirmed after your hold expired and the listing reached maximum capacity (30 of 30 contacts unlocked). An automatic M-Pesa refund of KSH ${feeKsh} has been processed back to ${phone_number}.`,
        });
      }

      // Deduplication: Grant each unlock once per confirmed M-Pesa transaction ID
      if (confirmedTransactions.has(transactionId)) {
        return res.status(409).json({
          success: false,
          message: 'Transaction ID has already been credited to an unlock',
        });
      }
      confirmedTransactions.add(transactionId);

      // Release hold
      if (hold_id) activeHolds.delete(hold_id);

      const unlockRecord: ServerUnlockRecord = {
        id: `unl_${Date.now()}`,
        request_id,
        operator_id,
        tier: tierLabel,
        fee_ksh: feeKsh,
        status: 'paid',
        paid_at: new Date().toISOString(),
        mpesa_transaction_id: transactionId,
      };
      serverUnlocks.set(`${request_id}_${operator_id}`, unlockRecord);

      const paymentRecord: ServerPaymentRecord = {
        id: `pay_${Date.now()}`,
        operator_id,
        type: 'unlock',
        request_id,
        request_title,
        amount_ksh: feeKsh,
        mpesa_transaction_id: transactionId,
        status: 'completed',
        paid_at: new Date().toISOString(),
        pass_expires_at: null,
      };
      serverPayments.push(paymentRecord);

      return res.json({
        success: true,
        status: 'completed',
        transactionId,
        amount_ksh: feeKsh,
        tier: tierLabel,
        paid_at: unlockRecord.paid_at,
        message: `M-Pesa payment of KSH ${feeKsh} confirmed (${transactionId}). Contact unlocked successfully.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Unlock processing error' });
    }
  });

  // API 5: Pay 24-Hour Bidding Pass (KSH 850 by M-Pesa for 24 hours)
  app.post('/api/pass/pay', (req: Request, res: Response) => {
    try {
      const { operator_id, phone_number = '0722456789', simulate_failure = false, is_profile_complete = true } = req.body;

      if (!operator_id) {
        return res.status(400).json({ success: false, message: 'Operator ID is required' });
      }

      // Enforce Profile Gate: operator must complete private profile before paying for a pass
      if (!is_profile_complete) {
        return res.status(403).json({
          success: false,
          message: 'Create your profile to start bidding. Your profile is private.',
        });
      }

      const amount = adminSettings.biddingPassFeeKsh; // KSH 850
      const prefix = ['QHK', 'RJK', 'SMT', 'TLP', 'UKW', 'VMN'][Math.floor(Math.random() * 6)];
      const randomSuffix = Math.floor(1000000 + Math.random() * 9000000).toString();
      const transactionId = `${prefix}${randomSuffix.substring(0, 7)}`;

      if (simulate_failure) {
        serverPayments.push({
          id: `pay_fail_${Date.now()}`,
          operator_id,
          type: 'pass',
          request_id: null,
          request_title: '24-hour pass',
          amount_ksh: amount,
          mpesa_transaction_id: transactionId,
          status: 'failed',
          failure_reason: 'User cancelled M-Pesa PIN prompt or request timed out',
          paid_at: new Date().toISOString(),
        });

        return res.json({
          success: false,
          status: 'failed',
          notCharged: true,
          transactionId,
          amount_ksh: amount,
          failureReason: 'User cancelled M-Pesa PIN prompt or request timed out',
          message: 'M-Pesa payment attempt was cancelled. Not charged.',
          timestamp: new Date().toISOString(),
        });
      }

      // Ensure single-grant per transaction ID
      if (confirmedTransactions.has(transactionId)) {
        return res.status(409).json({
          success: false,
          message: 'Transaction ID has already been credited to a pass',
        });
      }
      confirmedTransactions.add(transactionId);

      const passExpiresAt = new Date(Date.now() + adminSettings.biddingPassDurationHours * 3600 * 1000).toISOString();

      serverPayments.push({
        id: `pay_${Date.now()}`,
        operator_id,
        type: 'pass',
        request_id: null,
        request_title: '24-hour pass',
        amount_ksh: amount,
        mpesa_transaction_id: transactionId,
        status: 'completed',
        paid_at: new Date().toISOString(),
        pass_expires_at: passExpiresAt,
      });

      return res.json({
        success: true,
        status: 'completed',
        amount_ksh: amount,
        currency: 'KSH',
        transactionId,
        passExpiresAt,
        message: `M-Pesa payment of KSH ${amount} confirmed (${transactionId}). 24-hour bidding pass granted.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Pass payment error' });
    }
  });

  // Legacy fallback API: Safaricom M-Pesa STK Push
  app.post('/api/mpesa/stkpush', (req: Request, res: Response) => {
    try {
      const { operator_id, phone_number, pass_type = 'bidding', simulate_failure } = req.body;

      if (!operator_id) {
        return res.status(400).json({ success: false, message: 'Operator ID is required' });
      }

      const amount = 850;
      const prefix = ['QHK', 'RJK', 'SMT', 'TLP', 'UKW', 'VMN'][Math.floor(Math.random() * 6)];
      const randomSuffix = Math.floor(1000000 + Math.random() * 9000000).toString();
      const transactionId = `${prefix}${randomSuffix.substring(0, 7)}`;

      if (simulate_failure) {
        return res.json({
          success: false,
          status: 'failed',
          notCharged: true,
          transactionId,
          amount,
          pass_type,
          failureReason: 'User cancelled M-Pesa PIN prompt or request timed out',
          message: 'M-Pesa payment attempt was cancelled. Not charged.',
          timestamp: new Date().toISOString(),
        });
      }

      if (confirmedTransactions.has(transactionId)) {
        return res.status(409).json({
          success: false,
          message: 'Transaction ID has already been credited to a pass',
        });
      }

      confirmedTransactions.add(transactionId);
      const passExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      return res.json({
        success: true,
        status: 'completed',
        amount,
        amount_ksh: amount,
        pass_type,
        currency: 'KSH',
        transactionId,
        passExpiresAt,
        message: `M-Pesa payment of KSH ${amount} confirmed (${transactionId}). 24-hour bidding pass granted.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Payment processing error' });
    }
  });

  // API 3: Traveler Request & Unlock Controls (Server-enforced ownership)
  app.post('/api/traveler/request-control', (req: Request, res: Response) => {
    try {
      const {
        user_id,
        traveler_id,
        action,
        request_id,
        additional_slots,
        additional_unlocks,
        additional_days,
        bid_count = 0,
        unlock_count = 0,
        unlocks_enabled,
        booked_operator_id,
      } = req.body;

      if (!user_id || !traveler_id) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing traveler credentials' });
      }

      // Enforce rule: only the traveler who posted can perform controls
      if (user_id !== traveler_id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only the traveler who posted this request can modify unlocks, bids, or status',
        });
      }

      switch (action) {
        case 'add_unlocks':
        case 'add_slots': {
          const unlocksToAdd = Number(additional_unlocks || additional_slots);
          if (unlocksToAdd !== 10 && unlocksToAdd !== 20) {
            return res.status(400).json({ success: false, message: 'Unlock extension must be +10 or +20 unlocks' });
          }
          return res.json({
            success: true,
            action: 'add_unlocks',
            addedUnlocks: unlocksToAdd,
            message: `Successfully added +${unlocksToAdd} unlocks to your request.`,
          });
        }

        case 'toggle_unlocks': {
          const enabled = Boolean(unlocks_enabled);
          return res.json({
            success: true,
            action: 'toggle_unlocks',
            unlocks_enabled: enabled,
            message: enabled
              ? 'Contact unlocking allowed. Verified operators can now unlock your contact directly.'
              : 'Contact unlocking stopped. New unlocks are paused; operators can now submit bids only.',
          });
        }

        case 'extend_time': {
          const daysToAdd = Number(additional_days);
          if (daysToAdd !== 3 && daysToAdd !== 7) {
            return res.status(400).json({ success: false, message: 'Time extension must be +3 or +7 days' });
          }
          return res.json({
            success: true,
            action: 'extend_time',
            addedDays: daysToAdd,
            message: `Successfully extended enquiry expiry by ${daysToAdd} days.`,
          });
        }

        case 'close_enquiry':
        case 'close_bidding': {
          return res.json({
            success: true,
            action: 'close_enquiry',
            message: 'Operators will no longer be able to bid or unlock your contact. You can still see all bids.',
          });
        }

        case 'reopen_request': {
          return res.json({
            success: true,
            action: 'reopen_request',
            message: 'Enquiry successfully re-opened! Operators can resume submitting bids and unlocking contacts.',
          });
        }

        case 'edit_request': {
          // Rule: "Edit request: allowed only while the request has no bids and no unlocks"
          if (Number(bid_count) > 0 || Number(unlock_count) > 0) {
            return res.status(400).json({
              success: false,
              message: 'Editing is not allowed. A request can only be edited while it has 0 bids and 0 unlocks.',
            });
          }
          return res.json({
            success: true,
            action: 'edit_request',
            message: 'Listing details updated successfully.',
          });
        }

        case 'mark_booked': {
          if (!booked_operator_id) {
            return res.status(400).json({ success: false, message: 'Please select the operator you booked with.' });
          }
          return res.json({
            success: true,
            action: 'mark_booked',
            booked_operator_id,
            message: 'Request marked as booked! You can now rate and review this operator.',
          });
        }

        case 'repost': {
          return res.json({
            success: true,
            action: 'repost',
            message: 'Expired request authorized for re-posting with fresh 30 unlocks for 7 days.',
          });
        }

        default:
          return res.status(400).json({ success: false, message: 'Unknown request action' });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Server control verification failed' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'Elephantastic Safaris API', timestamp: new Date().toISOString() });
  });

  // In development, mount Vite dev server with middlewareMode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the compiled dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Elephantastic Safaris Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
