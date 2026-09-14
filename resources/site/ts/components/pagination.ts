import { apiRequest } from '../api/client';
import { EVENTS, listen } from '../events';
import { toastManager } from '../services/toast/runtime';
import { fetchItems } from '../utils/items';

type ItemsResponse = {
  success?: boolean;
  message?: string;
  data: {
    items?: string;
    pagination?: string;
    filters?: any;
  };
};

export function pagination(apiUrl: string,itemsGrid?:string, paginationContainer?:string, headerClass?: string) {
  const { __ } = window.wp.i18n;

  return {
    isLoading: false,
    itemsGrid: itemsGrid || 'kecom-products-grid',
    paginationContainer: paginationContainer || 'kecom-pagination-container',
    headerClass: headerClass || 'kecom-breadcrumb-list',
    apiUrl: apiUrl,

    init() {
      // Intercept pagination clicks dynamically
      const paginationContainer = document.querySelector(`.${this.paginationContainer}`);
      if (paginationContainer) {
        paginationContainer.addEventListener('click', (e: Event) => {
          const target = e.target as HTMLElement;
          const link = target.closest('a.kecom-page-link')!;
          if (link) {
            e.preventDefault();
            const urlObj = new URL((link as HTMLAnchorElement).href);

            // Update the browser URL with the current page path and the query parameters from the pagination link
            window.history.pushState({}, '', window.location.pathname + urlObj.search);
            void fetchItems(this.apiUrl, this.itemsGrid, this.paginationContainer, this.headerClass, false, this.isLoading);
          }
        });
      }
    }
  };
}
