/**
 * Alpine component: quantitySelector
 * Reusable quantity input with +/- buttons.
 *
 * PHP usage:
 *   <div x-data="quantitySelector({
 *     min: 1,
 *     max: 99,
 *     initial: 1,
 *     onChange: (qty) => console.log(qty)
 *   })">
 */

export interface QuantitySelectorConfig {
  min?: number;
  max?: number;
  initial?: number;
  onChange?: (quantity: number) => void;
}

export function quantitySelector(config: QuantitySelectorConfig = {}) {
  return {
    quantity: config.initial ?? 1,
    min: config.min ?? 1,
    max: config.max,

    increment() {
      if (this.max === undefined || this.quantity < this.max) {
        this.quantity++;
        this.notifyChange();
      }
    },

    decrement() {
      if (this.quantity > this.min) {
        this.quantity--;
        this.notifyChange();
      }
    },

    setValue(value: string) {
      const num = parseInt(value, 10);

      if (!isNaN(num) && num >= this.min && (this.max === undefined || num <= this.max)) {
        this.quantity = num;
        this.notifyChange();
      }
    },

    notifyChange() {
      config.onChange?.(this.quantity);
      (this as any).$dispatch("quantity-change", { quantity: this.quantity });
    },
  };
}
