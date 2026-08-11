import { cartApi } from "../api/cart";
import { toastManager } from "../services/toast/runtime";



export function cart() {
  const { __ } = window.wp.i18n;

  return {
    loading: false,
    success: false,
    error: null as string | null,
    cartData: window.kirki_ecommerce.cart,

    format_cart_items() {
      if (this.cartData.items.length > 0) {
        const cart_items = {} as Record<string, any>;
        this.cartData.items.forEach((item: any) => {
          cart_items[item.id] = {
            total: item.display_total_money_object.display,
            product_total: item.display_product_total_money_object.display,
          };
        });
        this.cartData.formatted_items = cart_items;
      }
    },

    init() {
      this.format_cart_items();
    },

    async update(id: number, qty?: number) {
      const quantity = Number(qty);
      const itemId = Number(id);

      try {
        const result = await cartApi.updateItem(itemId, quantity);
        this.cartData = Object.assign(this.cartData, result.data);
        this.format_cart_items();
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : null;
        toastManager.error(this.error ?? __("Something went wrong", "kirki-ecommerce"));
      }

    },

    async remove(id: number) {
      this.loading = true;
      this.error = null;
      const itemId = Number(id);

      try {
        const result = await cartApi.removeItem(itemId);
        this.cartData = Object.assign(this.cartData, result.data);
        const item = document.getElementById(String(itemId));
        if (item) {
          item.remove();
        }

        if (this.cartData.items_count === 0) {
          const cartItems = document.querySelector('.kecom-cart-items');
          if (cartItems) {
            const empty_cart = document.createElement('h4');
            empty_cart.className = 'kecom-cart-items-empty-text';
            empty_cart.textContent = __('No items currently in cart.', 'kirki-ecommerce');
            cartItems.appendChild(empty_cart);
          }
        }
        toastManager.success(__("Item removed to cart", "kirki-ecommerce"));
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : null;
        toastManager.error(this.error ?? __("Something went wrong", "kirki-ecommerce"));
      } finally {
        this.loading = false;
      }
    }
  };
}
