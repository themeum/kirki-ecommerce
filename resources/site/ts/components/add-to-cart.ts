/**
 * Alpine component: addToCart
 * Works on both product list cards and the product detail page.
 *
 * PHP usage:
 *   <button x-data="addToCart({ variantId: <?= $variant->id ?>, qty: 1 })"
 *           @click="add" :disabled="loading" :class="{ 'kecom-btn-loading': loading }"
 *           x-text="buttonText">
 *   </button>
 */

import { cartApi } from '../api/cart';

export interface AddToCartConfig {
  variantId: number;
  qty?: number;
  cartUrl?: string;
  watchVariantId?: () => number;
  buttonText?: string;
}

export function addToCart(config: AddToCartConfig) {
  return {
    variantId: config.variantId,
    qty: config.qty ?? 1,
    cartUrl: config.cartUrl || '/cart',
    watchVariantId: config.watchVariantId,
    buttonText: config.buttonText || 'Add to Cart',
    loading: false,
    success: false,
    error: null as string | null,
    viewCartText: 'View Cart',

    init(this: any) {
      this.checkIfInCart();
      
      // Watch for variant ID changes (for product detail page)
      if (this.watchVariantId) {
        this.$watch(() => this.watchVariantId(), () => {
          this.variantId = this.watchVariantId();
          this.checkIfInCart();
        });
      }
    },

    checkIfInCart() {
      const cartVariantIds = (window as any).kirki_ecommerce?.cart_variant_ids || [];
      if (cartVariantIds.includes(this.variantId)) {
        this.success = true;
        this.buttonText = this.viewCartText;
      } else {
        this.success = false;
        this.buttonText = config.buttonText || 'Add to Cart';
      }
    },

    async add(qty?: number) {
      this.loading = true;
      this.error = null;
      const quantity = Number(qty ?? this.qty);
      try {
        await cartApi.addItem(this.variantId, quantity);
        this.success = true;
        this.buttonText = 'View Cart';
        
        // Update cart_variant_ids in window.kirki_ecommerce after successful add
        const cartVariantIds = (window as any).kirki_ecommerce?.cart_variant_ids || [];
        if (!cartVariantIds.includes(this.variantId)) {
          cartVariantIds.push(this.variantId);
          (window as any).kirki_ecommerce.cart_variant_ids = cartVariantIds;
        }
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Could not add to cart';
        this.buttonText = 'Add to Cart';
      } finally {
        this.loading = false;
      }
    },
  };
}
