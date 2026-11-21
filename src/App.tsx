/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { supabase } from './supabaseClient';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { AuthPromptModal } from './components/AuthPromptModal';

// 14 Pages across 3 Audiences
import { HomePage } from './pages/HomePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AuthPage } from './pages/AuthPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostDetailPage } from './pages/BlogPostDetailPage';
import { SharedRequestPage } from './pages/SharedRequestPage';

// Traveler Pages
import { PostRequestPage } from './pages/traveler/PostRequestPage';
import { MyRequestsPage } from './pages/traveler/MyRequestsPage';
import { TravelerRequestDetailPage } from './pages/traveler/TravelerRequestDetailPage';

import { OperatorSignupPage } from './pages/operator/OperatorSignupPage';
import { VerificationStatusPage } from './pages/operator/VerificationStatusPage';
import { OpenRequestsPage } from './pages/operator/OpenRequestsPage';
import { OperatorRequestDetailPage } from './pages/operator/OperatorRequestDetailPage';
import { MyBidsPage } from './pages/operator/MyBidsPage';
import { PayAccessPage } from './pages/operator/PayAccessPage';
import { OperatorDashboardPage } from './pages/operator/OperatorDashboardPage';

// Admin Pages
import { VerificationQueuePage } from './pages/admin/VerificationQueuePage';
import { ReportsPaymentsPage } from './pages/admin/ReportsPaymentsPage';

import { Users, Compass, Briefcase, ShieldCheck } from 'lucide-react';

const PUBLIC_TABS = new Set(['home', 'how-it-works', 'login', 'blog', 'blog-detail', 'shared-request']);

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = useApp();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const isPrivatePage = !PUBLIC_TABS.has(activeTab);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      if (!isPrivatePage) {
        return;
      }

      setAuthChecked(false);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        setHasSession(false);
        setAuthChecked(true);
        if (window.location.pathname !== '/login') {
          window.history.pushState(null, '', '/login');
        }
        setActiveTab('login', 'signin');
      } else {
        setHasSession(true);
        setAuthChecked(true);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const loggedIn = Boolean(session);
      setHasSession(loggedIn);
      if (isPrivatePage && !loggedIn) {
        if (window.location.pathname !== '/login') {
          window.history.pushState(null, '', '/login');
        }
        setActiveTab('login', 'signin');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [activeTab, isPrivatePage]);

  const renderActivePage = () => {
    if (isPrivatePage && (!authChecked || !hasSession)) {
      return null;
    }

    switch (activeTab) {
      // Public pages
      case 'home':
        return <HomePage />;
      case 'how-it-works':
        return <HowItWorksPage />;
      case 'login':
        return <AuthPage />;
      case 'blog':
        return <BlogPage />;
      case 'blog-detail':
        return <BlogPostDetailPage />;
      case 'shared-request':
        return <SharedRequestPage />;

      // Traveler pages
      case 'traveler-post':
        return <PostRequestPage />;
      case 'traveler-dashboard':
      case 'traveler-my-requests':
        return <MyRequestsPage />;
      case 'traveler-request-detail':
        return <TravelerRequestDetailPage />;

      // Operator pages
      case 'operator-dashboard':
        return <OperatorDashboardPage />;
      case 'operator-signup':
        return <OperatorSignupPage />;
      case 'operator-status':
        return <VerificationStatusPage />;
      case 'operator-open-requests':
        return <OpenRequestsPage />;
      case 'operator-request-detail':
        return <OperatorRequestDetailPage />;
      case 'operator-my-bids':
        return <MyBidsPage />;
      case 'operator-pay':
        return <PayAccessPage />;

      // Admin pages
      case 'admin-verification':
        return <VerificationQueuePage />;
      case 'admin-reports':
        return <ReportsPaymentsPage />;

      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-mountain-hostel selection:bg-desert-atlas/30 selection:text-safari-dusk font-sans">
      {/* Top Bar adheres to Top Bar Contract */}
      <Navbar />

      {/* Main Page Canvas */}
      <main className="flex-1">
        {renderActivePage()}
      </main>

      {/* Floating Persona Test Assistant Bar */}
      <div className="fixed bottom-4 right-4 z-30">
        <button
          onClick={() => setRoleSwitcherOpen(true)}
          className="px-3.5 py-2 rounded-full bg-safari-dusk text-stone-100 hover:bg-safari-dusk-light text-xs font-semibold shadow-lg border border-desert-atlas/40 flex items-center gap-2 transition-all hover:scale-105"
          title="Switch demo persona (Traveler, Operator, Admin)"
        >
          {currentUser ? (
            <>
              {currentUser.role === 'traveler' ? (
                <Compass className="w-3.5 h-3.5 text-highlight-accent" />
              ) : currentUser.role === 'operator' ? (
                <Briefcase className="w-3.5 h-3.5 text-desert-atlas" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-desert-atlas" />
              )}
              <span>Persona: <strong className="text-desert-atlas-light">{currentUser.name.split(' ')[0]}</strong> ({currentUser.role})</span>
              <span className="text-[10px] text-desert-atlas underline font-normal">Switch</span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5 text-desert-atlas" />
              <span>Browsing as: <strong className="text-desert-atlas-light">Guest</strong></span>
              <span className="text-[10px] text-desert-atlas underline font-normal">Log In / Switch</span>
            </>
          )}
        </button>
      </div>

      <RoleSwitcherModal
        isOpen={roleSwitcherOpen}
        onClose={() => setRoleSwitcherOpen(false)}
      />

      {/* Auth Prompt Modal (Prompts registration/sign up first) */}
      <AuthPromptModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
