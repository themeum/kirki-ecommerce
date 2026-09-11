import { apiRequest } from '../api/client';
import { emit, EVENTS } from '../events';
import { toastManager } from '../services/toast/runtime';

type ShopProductsResponse = {
  success?: boolean;
  message?: string;
  data: {
    products?: string;
    pagination?: string;
    filters?: any;
  };
};

export function shop() {
  const { __ } = window.wp.i18n;

  return {
    sortBy: 'recommended',
    searchQuery: '',
    searchOpen: false,
    searchBtnVisible: true,
    isLoading: false,

    init() {
      // Read initial sort_by and search from URL params
      const params = new URLSearchParams(window.location.search);
      this.sortBy = params.get('sort_by') || 'recommended';
      this.searchQuery = params.get('search') || '';
      // Auto-open search if a query is already present in the URL
      if (this.searchQuery) {
        this.searchOpen = true;
        this.searchBtnVisible = false;
      }

      // Handle browser back/forward buttons
      window.addEventListener('popstate', () => {
        const currentParams = new URLSearchParams(window.location.search);
        this.sortBy = currentParams.get('sort_by') || 'recommended';
        this.searchQuery = currentParams.get('search') || '';
        void this.fetchProducts();
      });

      // Intercept pagination clicks dynamically
      const paginationContainer = document.querySelector('.kecom-pagination-container');
      if (paginationContainer) {
        paginationContainer.addEventListener('click', (e: Event) => {
          const target = e.target as HTMLElement;
          const link = target.closest('a.kecom-page-link')!;
          if (link) {
            e.preventDefault();
            const urlObj = new URL((link as HTMLAnchorElement).href);

            // Update the browser URL with the current page path and the query parameters from the pagination link
            window.history.pushState({}, '', window.location.pathname + urlObj.search);
            void this.fetchProducts(true);
          }
        });
      }
    },

    openSearch() {
      this.searchBtnVisible = false;
      this.searchOpen = true;
      setTimeout(() => {
        const input = document.getElementById('kecom-search-input') as HTMLInputElement | null;
        input?.focus();
      }, 50);
    },

    closeSearch() {
      this.searchOpen = false;

      // Wait for the field leave transition before showing the button
      setTimeout(() => {
        this.searchBtnVisible = true;
      }, 50);

      if (this.searchQuery) {
        this.searchQuery = '';
        this.search();
      }
    },

    applySort(value: string) {
      this.sortBy = value;

      const params = new URLSearchParams(window.location.search);
      if (value === 'recommended') {
        params.delete('sort_by');
      } else {
        params.set('sort_by', value);
      }

      // "if any time other filter added than current_page value will be reset to 1."
      params.delete('current_page');

      const queryString = params.toString();
      const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
      window.history.pushState({}, '', newUrl);

      void this.fetchProducts();
    },

    search() {
      const params = new URLSearchParams(window.location.search);
      const query = this.searchQuery.trim();

      if (query) {
        params.set('search', query);
      } else {
        params.delete('search');
      }

      // Reset page to 1 when search query changes
      params.delete('current_page');

      const queryString = params.toString();
      const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
      window.history.pushState({}, '', newUrl);

      void this.fetchProducts();
    },

    applySearch(value?: string) {
      if (value !== undefined) {
        this.searchQuery = value;
      }
      this.search();
    },

    async fetchProducts(shouldScroll = false) {
      this.isLoading = true;
      try {
        const params = new URLSearchParams(window.location.search);
        const result = await apiRequest<ShopProductsResponse>(
          `/shop/products?format=html&${params.toString()}`,
        );

        if (result && result.success !== false && result.data) {
          // Update products grid
          const productsGrid = document.querySelector('.kecom-products-grid');
          if (productsGrid && result.data.products !== undefined) {
            productsGrid.innerHTML = result.data.products;
          }

          // Update pagination container
          const paginationContainer = document.querySelector('.kecom-pagination-container');
          if (paginationContainer && result.data.pagination !== undefined) {
            paginationContainer.innerHTML = result.data.pagination;
          }

          // Smoothly scroll to the page title if requested
          if (shouldScroll) {
            const pageTitle = document.querySelector('.kecom-breadcrumb-list');
            if (pageTitle) {
              pageTitle.scrollIntoView({ behavior: 'smooth' });
            }
          }

          // Dispatch event for any other components that need to know products updated
          emit(EVENTS.SHOP_PRODUCTS_UPDATED, result.data);
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
