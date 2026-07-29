/**
 * Alpine component: addToWishlist
 * Toggle button that works on both product list and detail pages.
 *
 * PHP usage:
 *   <button x-data="addToWishlist({ productId: <?= $product->id ?>,
 *                                   name: '<?= esc_js($product->title) ?>',
 *                                   url: '<?= esc_url($product->get_url()) ?>' })"
 *           @click="toggle"
 *           :aria-label="inWishlist ? 'Remove from wishlist' : 'Add to wishlist'">
 *     <span x-text="inWishlist ? '♥' : '♡'"></span>
 *   </button>
 */

import type { WishlistItem } from '../types';

export interface AddToWishlistConfig {
  productId: number;
  variantId?: number;
  name: string;
  image?: string;
  price?: number;
  url?: string;
}

export function addToWishlist(config: AddToWishlistConfig) {
  return {
    productId: config.productId,

    get inWishlist(): boolean {
      return (this.$store as any).wishlistStore.has(this.productId);
    },

    toggle() {
      const item: WishlistItem = {
        product_id: config.productId,
        variant_id: config.variantId,
        name: config.name,
        image: config.image,
        price: config.price,
        url: config.url,
      };
      (this.$store as any).wishlistStore.toggle(item);
    },
  };
}
