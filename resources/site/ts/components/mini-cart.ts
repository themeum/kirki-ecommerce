/**
 * Alpine component: miniCart
 */

export interface MiniCartConfig {
  initialCount?: number;
}

export function miniCart(config: MiniCartConfig = {}) {
  return {
    cartCount: Number(config.initialCount || 0),
    direction: null as "increase" | "decrease" | null,

    updateCount(newCount: number) {
      newCount = Number(newCount);

      if (newCount === this.cartCount) {
        return;
      }

      this.direction = newCount > this.cartCount ? "increase" : "decrease";
      this.cartCount = newCount;

      setTimeout(() => {
        this.direction = null;
      }, 300);
    },
  };
}
