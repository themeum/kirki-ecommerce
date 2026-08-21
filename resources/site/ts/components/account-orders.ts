import { accountApi } from '../api/account';
import { toastManager } from '../services/toast/runtime';


export function accountOrders() {
  const { __ } = window.wp.i18n;

  return {
    currentPage: 1,
    hasMorePages: true,
    isLoading: false,

    async fetchOrders() {
      if (!this.hasMorePages || this.isLoading) {
        return;
      }

      this.isLoading = true;

      try {
        this.currentPage++;
        const res = await accountApi.getOrders({
          page: this.currentPage,
          format: 'html',
        });

        const tableBody = document.querySelector('.kecom-orders-table tbody');
        const html = res.data.results;
        tableBody?.insertAdjacentHTML('beforeend', html);

        this.currentPage = res.data.current_page;
        this.hasMorePages = res.data.has_more_pages;

      } catch (error) {
        console.error('Error fetching orders:', error);
        toastManager.error(__('Failed to retrieve orders. Please try again.', 'kirki-ecommerce'));
      } finally {
        this.isLoading = false;
      }
    },
  };
}
