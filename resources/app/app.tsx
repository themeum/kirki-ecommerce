import { ThemeProvider } from '@emotion/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';

import Init from '@/init/init';
import { queryClient } from '@/libs/query-client';
import { router } from '@/routes';
import { theme } from '@/theme';
import GlobalStyles from '@/theme/global-styles';
import { TOAST_CLOSE_BUTTON_CLASS } from '@/theme/shell-styles';

const App = () => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <QueryClientProvider client={queryClient}>
        <Init>
          <Toaster
            richColors
            closeButton
            position="top-right"
            toastOptions={{
              classNames: {
                closeButton: TOAST_CLOSE_BUTTON_CLASS,
              },
              style: {
                padding: theme.spacing[4],
                backgroundColor: theme.colors.background.fill,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.default}`,
              },
            }}
          />
          <RouterProvider router={router} />
        </Init>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;

const resetActiveMenu = (root: HTMLElement): void => {
  const activeMenus = root.querySelectorAll('& > ul > li.current');

  for (const menu of [...activeMenus]) {
    menu.classList.remove('current');
  }
};

// `/settings/payment` -> `/settings`, `/` -> `/`.
const getLeadingRouteSegment = (pathname: string): string => `/${pathname.split('/')[1] ?? ''}`;

// WordPress renders these menu links as bare hash changes on the current
// document. React Router never sees such a navigation, so its unsaved-changes
// blocker fails to stop it — silently, by React Router's own warning. Handing
// an in-app destination to the router instead is what lets the guard refuse it.
const getInAppPath = (href: string): string | null => {
  const target = new URL(href, window.location.href);
  const isSameDocument =
    target.pathname === window.location.pathname && target.search === window.location.search;
  // add_submenu_page() trims slashes from the slug, so Home's `#/` arrives as a bare `#`.
  const hash = target.hash || '#/';

  if (!isSameDocument || !hash.startsWith('#/')) {
    return null;
  }

  return hash.slice(1);
};

const checkActiveSubmenu = (root: HTMLElement, pathname: string): void => {
  const activeRoute = getLeadingRouteSegment(pathname);
  const menuItems = [...root.querySelectorAll('& > ul > li:not(:has(.kirki-menu-separator))')];

  for (const menuItem of menuItems) {
    const link = menuItem.querySelector('& > a')?.getAttribute('href');
    const menuPath = link ? getInAppPath(link) : null;

    if (menuPath !== null && getLeadingRouteSegment(menuPath) === activeRoute) {
      menuItem.classList.add('current');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const ecommerceAdminMenu = document.getElementById('toplevel_page_kirki-ecommerce');
  if (!ecommerceAdminMenu) {
    return;
  }

  const syncActiveMenu = (pathname: string): void => {
    resetActiveMenu(ecommerceAdminMenu);
    checkActiveSubmenu(ecommerceAdminMenu, pathname);
  };

  // In-app navigations (links, redirects, `navigate()`) use pushState, which
  // fires no popstate, so the menu follows the router state instead.
  syncActiveMenu(router.state.location.pathname);
  router.subscribe((state) => syncActiveMenu(state.location.pathname));

  const menuItems = [
    ...ecommerceAdminMenu.querySelectorAll('& > ul > li:not(:has(.gf-menu-separator))'),
  ];

  for (const menuItem of menuItems) {
    menuItem.addEventListener('click', (event: Event) => {
      event.preventDefault();
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as Element | null;
      const url = target?.closest('a')?.getAttribute('href');
      const inAppPath =
        url && !mouseEvent.metaKey && !mouseEvent.ctrlKey ? getInAppPath(url) : null;

      if (inAppPath) {
        void router.navigate(inAppPath);
        return;
      }

      resetActiveMenu(ecommerceAdminMenu);
      menuItem.classList.add('current');
      if (url) {
        if (mouseEvent.metaKey || mouseEvent.ctrlKey) {
          window.open(url, '_blank');
        } else {
          window.location.href = url;
        }
      }
    });
  }
});
