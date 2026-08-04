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

    async update(id: number, qty?: number) {
      const quantity = Number(qty);
      const itemId = Number(id);

      try {
        const result = await cartApi.updateItem(itemId, quantity);
        this.cart_value = Object.assign(this.cart_value, result.data);
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Cannot update item';
        toastManager.error(this.error);
      }

    },

    async remove(id: number) {
      this.loading = true;
      this.error = null;
      const itemId = Number(id);

      try {
        console.log(itemId);
        await cartApi.removeItem(itemId);
        toastManager.success(__("Item removed to cart", "kirki-ecommerce"));
        window.location.reload();
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Cannot remove item';
        toastManager.error(this.error);
      } finally {
        this.loading = false;
      }
    }
  };
}
