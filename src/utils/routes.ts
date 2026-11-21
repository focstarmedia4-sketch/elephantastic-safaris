// Bidirectional URL routing for Elephantastic Safaris
// Maps every page tab + optional parameter to a clean, shareable URL path and vice versa.

export interface ParsedRoute {
  tab: string;
  param: string | null;
}

const normalizePathname = (pathname: string): string => {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
};

export const getPathForTab = (tab: string, param?: string | null): string => {
  switch (tab) {
    case 'home':
      return '/';
    case 'how-it-works':
      return '/how-it-works';
    case 'login':
      if (param === 'register') return '/signup';
      if (param === 'traveler') return '/signup/traveler';
      if (param === 'operator') return '/signup/operator';
      return '/login';
    case 'blog':
      return param ? `/best-places/category/${encodeURIComponent(param)}` : '/best-places';
    case 'blog-detail':
      return param ? `/best-places/${encodeURIComponent(param)}` : '/best-places';
    case 'shared-request':
      return param ? `/request/${encodeURIComponent(param)}` : '/';
    case 'traveler-post':
      return param ? `/post-request/${encodeURIComponent(param)}` : '/post-request';
    case 'traveler-my-requests':
    case 'traveler-dashboard':
      return '/my-requests';
    case 'traveler-request-detail':
      return param ? `/my-requests/${encodeURIComponent(param)}` : '/my-requests';
    case 'operator-dashboard':
      return '/operator/dashboard';
    case 'operator-signup':
      return '/operator/register';
    case 'operator-status':
      return '/operator/verification';
    case 'operator-open-requests':
      return '/open-requests';
    case 'operator-request-detail':
      return param ? `/open-requests/${encodeURIComponent(param)}` : '/open-requests';
    case 'operator-my-bids':
      return '/operator/my-bids';
    case 'operator-pay':
      return '/operator/access-pass';
    case 'admin-verification':
      return '/admin/verification';
    case 'admin-reports':
      return '/admin/reports';
    default:
      return '/';
  }
};

export const parseLocationToTab = (pathname: string): ParsedRoute => {
  const path = normalizePathname(pathname);

  if (path === '/') return { tab: 'home', param: null };
  if (path === '/how-it-works') return { tab: 'how-it-works', param: null };

  // Auth routes
  if (path === '/login') return { tab: 'login', param: 'signin' };
  if (path === '/signup' || path === '/register') return { tab: 'login', param: 'register' };
  if (path === '/signup/traveler') return { tab: 'login', param: 'traveler' };
  if (path === '/signup/operator') return { tab: 'login', param: 'operator' };

  // Blog / Best Places routes
  if (path === '/best-places' || path === '/blog') {
    return { tab: 'blog', param: null };
  }
  if (path.startsWith('/best-places/category/')) {
    const category = decodeURIComponent(path.slice('/best-places/category/'.length));
    return { tab: 'blog', param: category || null };
  }
  if (path.startsWith('/best-places/')) {
    const slug = decodeURIComponent(path.slice('/best-places/'.length));
    return { tab: 'blog-detail', param: slug || null };
  }
  if (path.startsWith('/blog/')) {
    const slug = decodeURIComponent(path.slice('/blog/'.length));
    return { tab: 'blog-detail', param: slug || null };
  }

  // Public shared travel request routes
  if (path.startsWith('/request/')) {
    const reqId = decodeURIComponent(path.slice('/request/'.length));
    return { tab: 'shared-request', param: reqId || null };
  }
  if (path.startsWith('/requests/')) {
    const reqId = decodeURIComponent(path.slice('/requests/'.length));
    return { tab: 'shared-request', param: reqId || null };
  }

  // Traveler routes
  if (path === '/post-request') return { tab: 'traveler-post', param: null };
  if (path.startsWith('/post-request/')) {
    const category = decodeURIComponent(path.slice('/post-request/'.length));
    return { tab: 'traveler-post', param: category || null };
  }
  if (path === '/my-requests') return { tab: 'traveler-my-requests', param: null };
  if (path.startsWith('/my-requests/')) {
    const reqId = decodeURIComponent(path.slice('/my-requests/'.length));
    return { tab: 'traveler-request-detail', param: reqId || null };
  }

  // Operator routes
  if (path === '/operator/dashboard') return { tab: 'operator-dashboard', param: null };
  if (path === '/operator/register') return { tab: 'operator-signup', param: null };
  if (path === '/operator/verification') return { tab: 'operator-status', param: null };
  if (path === '/open-requests') return { tab: 'operator-open-requests', param: null };
  if (path.startsWith('/open-requests/')) {
    const reqId = decodeURIComponent(path.slice('/open-requests/'.length));
    return { tab: 'operator-request-detail', param: reqId || null };
  }
  if (path === '/operator/my-bids') return { tab: 'operator-my-bids', param: null };
  if (path === '/operator/access-pass') return { tab: 'operator-pay', param: null };

  // Admin routes
  if (path === '/admin/verification') return { tab: 'admin-verification', param: null };
  if (path === '/admin/reports') return { tab: 'admin-reports', param: null };

  return { tab: 'home', param: null };
};

export const getPageTitleForTab = (tab: string): string => {
  switch (tab) {
    case 'how-it-works':
      return 'How It Works | Elephantastic Safaris';
    case 'login':
      return 'Sign In & Sign Up | Elephantastic Safaris';
    case 'blog':
    case 'blog-detail':
      return 'Best Places to Visit in Kenya | Elephantastic Safaris';
    case 'shared-request':
      return 'Shared Travel Request | Elephantastic Safaris';
    case 'traveler-post':
      return 'Post a Trip Request | Elephantastic Safaris';
    case 'traveler-my-requests':
    case 'traveler-dashboard':
    case 'traveler-request-detail':
      return 'My Trip Requests | Elephantastic Safaris';
    case 'operator-dashboard':
      return 'Operator Dashboard | Elephantastic Safaris';
    case 'operator-signup':
      return 'Operator Registration | Elephantastic Safaris';
    case 'operator-status':
      return 'Verification Status | Elephantastic Safaris';
    case 'operator-open-requests':
    case 'operator-request-detail':
      return 'Open Traveler Requests | Elephantastic Safaris';
    case 'operator-my-bids':
      return 'My Bids | Elephantastic Safaris';
    case 'operator-pay':
      return 'Operator Access Pass | Elephantastic Safaris';
    case 'admin-verification':
      return 'Verification Queue | Elephantastic Safaris';
    case 'admin-reports':
      return 'Payments & Reports | Elephantastic Safaris';
    default:
      return 'Elephantastic Safaris';
  }
};
