import { wishlistApi } from '../api/wishlist';
import { toastManager } from '../services/toast/runtime';

export function accountWishlist() {

    const { __ } = window.wp.i18n;

    return {
        async emptyWishlist() {
            const result = await wishlistApi.empty();

            if (result.success) {
                toastManager.success(__('Wishlist emptied successfully', 'kirki-ecommerce'));
                window.location.reload();
            } else {
                toastManager.error(__('Failed to empty wishlist', 'kirki-ecommerce'));
            }
        },
    };
}