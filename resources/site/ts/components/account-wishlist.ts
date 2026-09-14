import { wishlistApi } from '../api/wishlist';
import { toastManager } from '../services/toast/runtime';

export function accountWishlist() {

    const { __ } = window.wp.i18n;

    return {
        clearModalOpen: false,
        loading: false,

        cancelClear() {
            this.clearModalOpen = false;
        },

        openClearModal() {
            this.clearModalOpen = true;
        },

        async emptyWishlist() {
            this.loading = true;
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
                this.loading = false;
                this.clearModalOpen = false;
            }
        },
    };
}