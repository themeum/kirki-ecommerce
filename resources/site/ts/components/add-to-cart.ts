/**
 * Alpine component: addToCart
 * Works on both product list cards and the product detail page.
 *
 * PHP usage:
 *   <button x-data="addToCart({ variantId: <?= $variant->id ?>, qty: 1 })"
 *           @click="add" :disabled="loading" :class="{ 'kecom-btn-loading': loading }">
 *     Add to Cart
 *   </button>
 */

export interface AddToCartConfig {
  variantId: number;
  qty?: number;
}

export function addToCart(config: AddToCartConfig) {
  return {
    variantId: config.variantId,
    qty: config.qty ?? 1,
    loading: false,
    success: false,
    error: null as string | null,

    async add() {
      this.loading = true;
      this.success = false;
      this.error = null;
      try {
        // Delegate to the global cartStore
        await (this.$store as any).cartStore.addItem(this.variantId, this.qty);
        this.success = true;
        // Reset success state after 2 s
        setTimeout(() => { this.success = false; }, 2000);
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Could not add to cart';
      } finally {
        this.loading = false;
      }
    },
  };
}
