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

export type QuantitySelectorConfig = {
  min?: number;
  max?: number | (() => number);
  initial?: number;
  onChange?: (quantity: number) => void;
}

export function quantitySelector(config: QuantitySelectorConfig = {}) {
  return {
    quantity: config.initial ?? 1,
    min: config.min ?? 1,

    get maxValue(): number | undefined {
      if (typeof config.max === 'function') {return config.max();}
      return config.max;
    },

    increment() {
      if (this.maxValue === undefined || this.quantity < this.maxValue) {
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
      if (!isNaN(num) && num >= this.min && (this.maxValue === undefined || num <= this.maxValue)) {
        this.quantity = num;
        this.notifyChange();
      }
    },

    notifyChange() {
      config.onChange?.(this.quantity);
      (this as any).$dispatch('kecom:quantity:changed', { quantity: this.quantity });
    },
  };
}
