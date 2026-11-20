import { Bid, BidFollowUp } from '../types';

/**
 * Extracts structured follow-ups alongside any legacy "\n\nFollow-up (date): text"
 * entries that may have been appended directly to `bid.message`.
 */
export function parseBidMessages(bid: Pick<Bid, 'id' | 'message' | 'follow_ups' | 'created_at'>): {
  initialMessage: string;
  followUps: BidFollowUp[];
} {
  const rawMessage = bid.message || '';
  const legacyRegex = /\n\nFollow-up \(([^)]+)\):\s*([\s\S]*?)(?=\n\nFollow-up \(|$)/g;

  const legacyFollowUps: BidFollowUp[] = [];
  let match: RegExpExecArray | null;
  let firstMatchIndex: number | null = null;

  while ((match = legacyRegex.exec(rawMessage)) !== null) {
    if (firstMatchIndex === null) {
      firstMatchIndex = match.index;
    }
    const dateLabel = match[1]?.trim();
    const text = match[2]?.trim();
    if (text) {
      legacyFollowUps.push({
        id: `${bid.id}_legacy_${legacyFollowUps.length}`,
        message: text,
        created_at: dateLabel || bid.created_at,
      });
    }
  }

  const initialMessage =
    firstMatchIndex !== null ? rawMessage.slice(0, firstMatchIndex).trim() : rawMessage.trim();

  const structuredFollowUps = Array.isArray(bid.follow_ups) ? bid.follow_ups : [];

  return {
    initialMessage,
    followUps: [...legacyFollowUps, ...structuredFollowUps],
  };
}
