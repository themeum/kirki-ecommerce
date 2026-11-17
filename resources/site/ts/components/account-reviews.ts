/**
 * Account Reviews Alpine Component
 *
 * @package Kirki\Ecommerce\Site
 * @since 1.0.1
 */

import { accountApi } from '../api/account';
import { toastManager } from '../services/toast/runtime';

export function accountReviews() {
  const { __ } = window.wp?.i18n || {
    __: (msg: string) => msg,
  };

  return {
    currentPage: 1,
    hasMorePages: true,
    isLoading: false,

    async fetchReviews() {
      if (!this.hasMorePages || this.isLoading) {
        return;
      }

      this.isLoading = true;

      try {
        this.currentPage++;
        const res = await accountApi.getReviews({
          page: this.currentPage,
          format: 'html',
        });

        const listContainer = document.querySelector('.kecom-account-reviews-list');
        const html = res.data?.results;
        if (html && listContainer) {
          listContainer.insertAdjacentHTML('beforeend', html);
        }

        this.currentPage = res.data?.current_page ?? this.currentPage;
        this.hasMorePages = Boolean(res.data?.has_more_pages);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toastManager.error(__('Failed to retrieve reviews. Please try again.', 'kirki-ecommerce'));
      } finally {
        this.isLoading = false;
      }
    },
  };
}
