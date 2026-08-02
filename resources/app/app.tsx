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

const checkActiveSubmenu = (root: HTMLElement): void => {
  const searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has('page') && searchParams.get('page') === 'ecommerce') {
    const hash = getLeadingRouteHash(window.location.hash || '#');

    const currentUrl = `admin.php?page=ecommerce${hash}`;
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
  const ecommerceAdminMenu = document.getElementById('toplevel_page_ecommerce');
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
  const ecommerceAdminMenu = document.getElementById('toplevel_page_ecommerce');
  if (!ecommerceAdminMenu) {
    return;
  }

  resetActiveMenu(ecommerceAdminMenu);
  checkActiveSubmenu(ecommerceAdminMenu);
});
