import { fetchItems } from '../utils/items';

export function shop() {
  const { __ } = window.wp.i18n;

  return {
    sortBy: 'recommended',
    searchQuery: '',
    searchOpen: false,
    searchBtnVisible: true,
    isLoading: false,
    itemsGrid: 'kecom-products-grid',
    paginationContainer: 'kecom-pagination-container',
    headerClass: 'kecom-breadcrumb-list',
    apiUrl: '/shop/products',

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
        void fetchItems(
          this.apiUrl,
          this.itemsGrid,
          this.paginationContainer,
          this.headerClass,
          false,
          this.isLoading,
        );
      });
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

      void fetchItems(
        this.apiUrl,
        this.itemsGrid,
        this.paginationContainer,
        this.headerClass,
        false,
        this.isLoading,
      );
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

      void fetchItems(
        this.apiUrl,
        this.itemsGrid,
        this.paginationContainer,
        this.headerClass,
        false,
        this.isLoading,
      );
    },

    applySearch(value?: string) {
      if (value !== undefined) {
        this.searchQuery = value;
      }
      this.search();
    },
  };
}
