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
            position="bottom-right"
            toastOptions={{
              style: { padding: theme.spacing[2] },
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

const getLeadingRouteHash = (hash: string): string => {
  const hashParts = hash.split('/');
  return hashParts.slice(0, 2).join('/');
};

// WordPress renders these menu links as bare hash changes on the current
// document. React Router never sees such a navigation, so its unsaved-changes
// blocker fails to stop it — silently, by React Router's own warning. Handing
// an in-app destination to the router instead is what lets the guard refuse it.
const getInAppPath = (href: string): string | null => {
  const target = new URL(href, window.location.href);
  const isSameDocument =
    target.pathname === window.location.pathname && target.search === window.location.search;

  if (!isSameDocument || !target.hash.startsWith('#/')) {
    return null;
  }

  return target.hash.slice(1);
};

const checkActiveSubmenu = (root: HTMLElement): void => {
  const searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has('page') && searchParams.get('page') === 'kirki-ecommerce') {
    const hash = getLeadingRouteHash(window.location.hash || '#');

    const currentUrl = `admin.php?page=kirki-ecommerce${hash}`;
    const menuItems = [...root.querySelectorAll('& > ul > li')];

    for (const menuItem of menuItems) {
      const link = menuItem.querySelector('& > a')?.getAttribute('href');
      if (link === currentUrl) {
        menuItem.classList.add('current');
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const ecommerceAdminMenu = document.getElementById('toplevel_page_kirki-ecommerce');
  if (!ecommerceAdminMenu) {
    return;
  }

  resetActiveMenu(ecommerceAdminMenu);
  checkActiveSubmenu(ecommerceAdminMenu);

  const menuItems = [
    ...ecommerceAdminMenu.querySelectorAll(
      '& > ul > li:not(:has(.gf-menu-separator))',
    ),
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
        void router.navigate(inAppPath).then(() => {
          resetActiveMenu(ecommerceAdminMenu);
          checkActiveSubmenu(ecommerceAdminMenu);
        });
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

window.addEventListener('popstate', () => {
  const ecommerceAdminMenu = document.getElementById('toplevel_page_kirki-ecommerce');
  if (!ecommerceAdminMenu) {
    return;
  }

  resetActiveMenu(ecommerceAdminMenu);
  checkActiveSubmenu(ecommerceAdminMenu);
});
