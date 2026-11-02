import { wishlistApi } from '../api/wishlist';
import { emit, EVENTS } from '../events';
import { toastManager } from '../services/toast/runtime';

export function wishlist(productId: number, wishlisted: boolean, context?: string) {
  const { __ } = window.wp.i18n;

  return {
    isWishlisted: wishlisted,
    wishlistCount: 0,

    init() {
        this.wishlistCount = Number(document.querySelector('.kecom-wishlist-count')?.textContent.replace('(', '').replace(')', ''))
    },

    async wishlistItem(variantId?: number) {
      try {
        if (this.isWishlisted) {
          const result = await wishlistApi.remove(productId);

          if (result && result.success !== false && result.data) {
            toastManager.success(__('Item removed from wishlist successfully.', 'kirki-ecommerce'));
            this.isWishlisted = false;
            
            if (context === 'account') {
              const wishlistCard = document.getElementById(`${productId}`);
              const wishlistCount = document.querySelector('.kecom-wishlist-count');
              if (wishlistCard) {
                wishlistCard.parentElement?.remove();
                if (wishlistCount) {
                  wishlistCount.textContent = `(${this.wishlistCount - 1})`;
                }
              }
            }
            emit(EVENTS.ACCOUNT_WISHLIST_REMOVED);
          } else {
            throw new Error(
              result?.message ||
                __('Failed to remove item from wishlist. Please try again.', 'kirki-ecommerce'),
            );
          }
        } else {
          const result = await wishlistApi.addItem(productId, variantId);
          if (result && result.success !== false && result.data) {
            toastManager.success(__('Item added to wishlist successfully.', 'kirki-ecommerce'));
            this.isWishlisted = true;
          } else {
            throw new Error(
              result?.message ||
                __('Failed to add item to wishlist. Please try again.', 'kirki-ecommerce'),
            );
          }
        }
      } catch (error: any) {
        toastManager.error(
          error.message || __('Something went wrong. Please try again.', 'kirki-ecommerce'),
        );
      }
    },
  };
}
