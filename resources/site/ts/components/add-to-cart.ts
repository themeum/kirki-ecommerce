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

import { cartApi } from "../api/cart";
import { Cookie } from "../cookie";
import { toastManager } from "../services/toast/runtime";

export interface AddToCartConfig {
  variantId: number;
  qty?: number;
  cartUrl?: string;
  watchVariantId?: () => number;
  buttonText?: string;
}

export function addToCart(config: AddToCartConfig) {
  const { __ } = window.wp.i18n;

  return {
    variantId: config.variantId,
    qty: config.qty ?? 1,
    cartUrl: config.cartUrl || "/cart",
    watchVariantId: config.watchVariantId,
    buttonText: config.buttonText || __("Add to Cart", "kirki-ecommerce"),
    loading: false,
    success: false,
    error: null as string | null,
    viewCartText: __("View Cart", "kirki-ecommerce"),

    init(this: any) {
      this.checkIfInCart();

      // Watch for variant ID changes (for product detail page)
      if (this.watchVariantId) {
        this.$watch(
          () => this.watchVariantId(),
          () => {
            this.variantId = this.watchVariantId();
            this.checkIfInCart();
          },
        );
      }
    },

    checkIfInCart() {
      const cartVariantIds = window.kirki_ecommerce?.cart_variant_ids || [];
      if (cartVariantIds.includes(this.variantId)) {
        this.success = true;
        this.buttonText = this.viewCartText;
      } else {
        this.success = false;
        this.buttonText = config.buttonText || __("Add to Cart", "kirki-ecommerce");
      }
    },

    async add(qty?: number) {

      this.loading = true;
      this.error = null;
      const quantity = Number(qty ?? this.qty);
      try {
        const { data } = await cartApi.addItem(this.variantId, quantity);
        if (data.cart_token !== '') {
          Cookie.set(window.kirki_ecommerce.cart_token_cookie_name, data.cart_token);
        }

        this.success = true;
        this.buttonText = "View Cart";

        // Show success toast
        toastManager.success(__("Item added to cart", "kirki-ecommerce"));

        document.dispatchEvent(new CustomEvent('kecom:cart-updated', { detail: data }));

        // Update cart_variant_ids in window.kirki_ecommerce after successful add
        const cartVariantIds = window.kirki_ecommerce?.cart_variant_ids || [];
        if (!cartVariantIds.includes(this.variantId)) {
          cartVariantIds.push(this.variantId);
          window.kirki_ecommerce.cart_variant_ids = cartVariantIds;
        }
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : "Could not add to cart";
        this.buttonText = config.buttonText || __("Add to Cart", "kirki-ecommerce");

        // Show error toast
        toastManager.error(this.error);
      } finally {
        this.loading = false;
      }
    },
  };
}
