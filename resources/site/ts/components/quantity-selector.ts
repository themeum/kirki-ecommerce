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

import { toastManager } from '../services/toast/runtime';

export type QuantitySelectorConfig = {
  min?: number;
  max?: number | (() => number);
  initial?: number;
  onChange?: (quantity: number) => void;
};

export function quantitySelector(config: QuantitySelectorConfig = {}) {
  const { __, sprintf } = window.wp.i18n;

  return {
    quantity: config.initial ?? 1,
    min: config.min ?? 1,

    get maxValue(): number | undefined {
      if (typeof config.max === 'function') {
        return config.max();
      }
      return config.max;
    },

    get max(): number | undefined {
      return this.maxValue;
    },

    get isMin(): boolean {
      return this.quantity <= this.min;
    },

    get isMax(): boolean {
      return this.maxValue !== undefined && this.quantity >= this.maxValue;
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

    setValue(value: string, inputEl?: HTMLInputElement) {
      if (value === '') {
        return;
      }

      let num = parseInt(value, 10);
      if (isNaN(num)) {
        num = this.min;
      }

      if (num < this.min) {
        num = this.min;
      } else if (this.maxValue !== undefined && num > this.maxValue) {
        num = this.maxValue;
        toastManager.warning(
          sprintf(__('Maximum available quantity is %d', 'kirki-ecommerce'), this.maxValue),
        );
      }
      this.quantity = num;

      const target =
        inputEl ??
        ((this as any).$el?.tagName === 'INPUT'
          ? (this as any).$el
          : (this as any).$el?.querySelector('input'));

      if (target && target.value !== String(num)) {
        target.value = String(num);
      }

      this.notifyChange();
    },

    handleBlur(inputEl?: HTMLInputElement) {
      const target =
        inputEl ??
        ((this as any).$el?.tagName === 'INPUT'
          ? (this as any).$el
          : (this as any).$el?.querySelector('input'));

      if (target) {
        const num = parseInt(target.value, 10);
        if (isNaN(num) || num < this.min) {
          this.setValue(String(this.min), target);
        } else if (this.maxValue !== undefined && num > this.maxValue) {
          this.setValue(String(this.maxValue), target);
        }
      }
    },

    notifyChange() {
      config.onChange?.(this.quantity);
      (this as any).$dispatch('kecom:quantity:changed', { quantity: this.quantity });
    },
  };
}
