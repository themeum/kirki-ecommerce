import { CartUpdateItem } from "@/ts/types";
import { cartApi } from "../api/cart";
import { toastManager } from "../services/toast/runtime";



export function cart(config: CartUpdateItem) {
  const { __ } = window.wp.i18n;

  return {
    loading: false,
    success: false,
    error: null as string | null,
    cart_value: config,

    init() {
      if (this.cart_value.items.length > 0) {
        const cart_items = {} as Record<string, string>;
        this.cart_value.items.forEach((item: any) => {
          cart_items[item.id] = item.total_formatted;
        });
        this.cart_value.formatted_items = cart_items;
      }
    },

    async update(id: number, qty?: number) {
      const quantity = Number(qty);
      const itemId = Number(id);

      try {
        const result = await cartApi.updateItem(itemId, quantity);
        this.cart_value = Object.assign(this.cart_value, result.data);
        if (this.cart_value.items.length > 0) {
          const cart_items = {} as Record<string, string>;
          this.cart_value.items.forEach((item: any) => {
            cart_items[item.id] = item.total_formatted;
          });
          this.cart_value.formatted_items = cart_items;
        }
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
        this.cart_value = Object.assign(this.cart_value, result.data);
        const item = document.getElementById(String(itemId));
        if (item) {
          item.remove();
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
