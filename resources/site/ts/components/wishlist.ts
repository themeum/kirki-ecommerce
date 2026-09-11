import { wishlistApi } from '../api/wishlist';
import { toastManager } from '../services/toast/runtime';
import { Variant } from './variant-selector';

export function wishlist(wishlisted: boolean,variantList?: Variant[], context?: string) {
  const { __ } = window.wp.i18n;

  return {
    isWishlisted: wishlisted,
    wishlistedVariants: {} as Record<number,boolean>,

    init() {
        if (variantList) {
            variantList.forEach((variant:Variant) => {
                this.wishlistedVariants[variant.id] = variant.is_wishlisted;
            });
        }
    },

    async wishlistItem(variantId: number) {
      try {
        if (this.isWishlisted) {
          const result = await wishlistApi.remove(variantId);

          if (result && result.success !== false && result.data) {
            toastManager.success(__('Item removed from wishlist successfully.', 'kirki-ecommerce'));
            this.isWishlisted = false;
            this.wishlistedVariants[variantId] = false;
            if (context === 'account') {
              const wishlistCard = document.getElementById(`${variantId}`);
              if (wishlistCard) {
                wishlistCard.parentElement?.remove();
              }
            }

          } else {
            throw new Error(
              result?.message ||
                __('Failed to remove item from wishlist. Please try again.', 'kirki-ecommerce'),
            );
          }
        } else {
          const result = await wishlistApi.addItem(variantId);
          if (result && result.success !== false && result.data) {
            toastManager.success(__('Item added to wishlist successfully.', 'kirki-ecommerce'));
            this.isWishlisted = true;
            this.wishlistedVariants[variantId] = true;
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
