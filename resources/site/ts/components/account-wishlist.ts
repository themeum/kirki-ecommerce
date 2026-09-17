import { wishlistApi } from '../api/wishlist';
import { EVENTS, listen } from '../events';
import { toastManager } from '../services/toast/runtime';
import { fetchItems } from '../utils/items';

export function accountWishlist() {

    const { __ } = window.wp.i18n;

    return {
        clearModalOpen: false,
        isLoading: false,
        apiUrl: '/account/wishlist',
        itemsGrid: 'kecom-products-grid',
        paginationContainer: 'kecom-pagination-container',
        headerClass: 'kecom-account-panel-header',

        init() {
            listen(EVENTS.ACCOUNT_WISHLIST_REMOVED, () => {
                const totalItems = document.querySelectorAll('.kecom-product-card')?.length;
                const params = new URLSearchParams(window.location.search);
                const currentPage = params.get('current_page') ?? 1;
                if (0 === totalItems) {
                    if (Number(currentPage) === 1) {
                        const newUrl = window.location.pathname;
                        window.history.pushState({}, '', newUrl);
                        window.location.reload();
                        return;
                    }
                    params.set('current_page', (Number(currentPage) - 1).toString());
                    window.location.search = params.toString();
                }

                void fetchItems(this.apiUrl, this.itemsGrid, this.paginationContainer, this.headerClass, false, this.isLoading);
            });
        },

        cancelClear() {
            this.clearModalOpen = false;
        },

        openClearModal() {
            this.clearModalOpen = true;
        },

        async emptyWishlist() {
            this.isLoading = true;
            try {
                const result = await wishlistApi.empty();
                if (result.success) {
                    toastManager.success(__('Wishlist emptied successfully', 'kirki-ecommerce'));
                    this.clearModalOpen = false;
                    window.location.reload();
                } else {
                    toastManager.error(__('Failed to empty wishlist', 'kirki-ecommerce'));
                }
            } catch (error: any) {
                toastManager.error(error?.message || __('Failed to empty wishlist', 'kirki-ecommerce'));
            } finally {
                this.isLoading = false;
                this.clearModalOpen = false;
            }
        },
    };
}