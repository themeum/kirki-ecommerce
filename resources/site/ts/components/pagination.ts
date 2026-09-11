import { apiRequest } from '../api/client';
import { toastManager } from '../services/toast/runtime';

type ItemsResponse = {
  success?: boolean;
  message?: string;
  data: {
    items?: string;
    pagination?: string;
    filters?: any;
  };
};

export function pagination(itemsGrid?:string, paginationContainer?:string, headerClass?: string, apiUrl?: string) {
  const { __ } = window.wp.i18n;

  return {
    isLoading: false,
    itemsGrid: itemsGrid || 'kecom-products-grid',
    paginationContainer: paginationContainer || 'kecom-pagination-container',
    headerClass: headerClass || 'kecom-breadcrumb-list',
    apiUrl: apiUrl || '/shop/products',

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
            void this.fetchItems(true);
          }
        });
      }
    },

    async fetchItems(shouldScroll = false) {
      this.isLoading = true;
      try {
        const params = new URLSearchParams(window.location.search);
        const result = await apiRequest<ItemsResponse>(
          `${this.apiUrl}?format=html&${params.toString()}`,
        );

        if (result && result.success !== false && result.data) {
          // Update products grid
          const itemsGrid = document.querySelector(`.${this.itemsGrid}`);
          if (itemsGrid && result.data.items !== undefined) {
            itemsGrid.innerHTML = result.data.items;
          }

          // Update pagination container
          const paginationContainer = document.querySelector(`.${this.paginationContainer}`);

          if (paginationContainer && result.data.pagination !== undefined) {
            paginationContainer.innerHTML = result.data.pagination;
          }

          // Smoothly scroll to the page title if requested
          if (shouldScroll) {
            const pageTitle = document.querySelector(`.${this.headerClass}`);
            if (pageTitle) {
              pageTitle.scrollIntoView({ behavior: 'smooth' });
            }
          }
        } else {
          throw new Error(result?.message || 'Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toastManager.error(__('Failed to retrieve products. Please try again.', 'kirki-ecommerce'));
      } finally {
        this.isLoading = false;
      }
    },
  };
}
