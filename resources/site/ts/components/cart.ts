import { cartApi } from '../api/cart';
import { toastManager } from '../services/toast/runtime';
import { config } from '../utils';

export function cart() {
  const { __ } = window.wp.i18n;

  return {
    loading: false,
    success: false,
    error: null as string | null,
    cartData: config.cart,

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
        document.dispatchEvent(new CustomEvent('kecom:cart-updated', { detail: result.data }));
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : null;
        toastManager.error(this.error ?? __('Something went wrong', 'kirki-ecommerce'));
      }
    },

    async remove(id: number) {
      this.loading = true;
      this.error = null;
      const itemId = Number(id);

      try {
        const result = await cartApi.removeItem(itemId);
        if (Object.keys(result.data).length === 0) {
          window.location.reload();
        }
        this.cartData = Object.assign(this.cartData, result.data);
        document.dispatchEvent(new CustomEvent('kecom:cart-updated', { detail: result.data }));
        const item = document.getElementById(String(itemId));
        if (item) {
          item.remove();
        }
        toastManager.success(__('Item removed from cart', 'kirki-ecommerce'));
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : null;
        toastManager.error(this.error ?? __('Something went wrong', 'kirki-ecommerce'));
      } finally {
        this.loading = false;
      }
    },
  };
}
