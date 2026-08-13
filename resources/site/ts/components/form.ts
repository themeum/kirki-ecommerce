/**
 * Alpine component: form
 * Simplified form validation for ecommerce forms
 *
 * PHP usage:
 *   <form x-data="form({ defaultValues: { email: '', password: '' } })" @submit.prevent="handleSubmit">
 *     <input x-bind="register('email', { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })">
 *     <span x-show="errors.email" x-text="errors.email"></span>
 *   </form>
 */

import { config } from "../utils";

export interface ValidationRules {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  email?: boolean | string;
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  validate?: (value: unknown) => boolean | string | Promise<boolean | string>;
}

export interface FieldError {
  type: string;
  message: string;
}

export interface FormConfig {
  defaultValues?: Record<string, unknown>;
  mode?: "onBlur" | "onChange" | "onSubmit";
}

export interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

const ValidationHelpers = {
  required(value: unknown, rule?: boolean | string): string | null {
    if (!rule) return null;
    const message = typeof rule === "string" ? rule : "This field is required";
    const isEmpty = !value || (typeof value === "string" && value.trim() === "");
    return isEmpty ? message : null;
  },

  minLength(value: string, rule: number | { value: number; message: string }): string | null {
    if (!value) return null;
    const minLength = typeof rule === "number" ? rule : rule.value;
    const message = typeof rule === "object" ? rule.message : `Minimum length is ${minLength}`;
    return value.length < minLength ? message : null;
  },

  maxLength(value: string, rule: number | { value: number; message: string }): string | null {
    if (!value) return null;
    const maxLength = typeof rule === "number" ? rule : rule.value;
    const message = typeof rule === "object" ? rule.message : `Maximum length is ${maxLength}`;
    return value.length > maxLength ? message : null;
  },

  pattern(value: string, rule: RegExp | { value: RegExp; message: string }): string | null {
    if (!value) return null;
    const pattern = rule instanceof RegExp ? rule : rule.value;
    const message = typeof rule === "object" && "message" in rule ? rule.message : "Invalid format";
    return !pattern.test(value) ? message : null;
  },

  email(value: string, rule?: boolean | string): string | null {
    if (!rule) return null;
    const message = typeof rule === "string" ? rule : "Invalid email address";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailPattern.test(value) ? message : null;
  },

  min(value: number, rule: number | { value: number; message: string }): string | null {
    const min = typeof rule === "number" ? rule : rule.value;
    const message = typeof rule === "object" ? rule.message : `Minimum value is ${min}`;
    return value < min ? message : null;
  },

  max(value: number, rule: number | { value: number; message: string }): string | null {
    const max = typeof rule === "number" ? rule : rule.value;
    const message = typeof rule === "object" ? rule.message : `Maximum value is ${max}`;
    return value > max ? message : null;
  },

  async custom(
    value: unknown,
    validate: (value: unknown) => boolean | string | Promise<boolean | string>,
  ): Promise<string | null> {
    try {
      const result = await validate(value);
      if (result === true) return null;
      return typeof result === "string" ? result : "Validation failed";
    } catch {
      return "Validation error";
    }
  },
};

async function validateField(value: unknown, rules?: ValidationRules): Promise<string | null> {
  if (!rules) return null;

  const stringValue = String(value || "");
  const numericValue = typeof value === "number" ? value : parseFloat(stringValue);

  const requiredError = ValidationHelpers.required(value, rules.required);
  if (requiredError) return requiredError;

  if (rules.email) {
    const emailError = ValidationHelpers.email(stringValue, rules.email);
    if (emailError) return emailError;
  }

  if (rules.minLength) {
    const error = ValidationHelpers.minLength(stringValue, rules.minLength);
    if (error) return error;
  }

  if (rules.maxLength) {
    const error = ValidationHelpers.maxLength(stringValue, rules.maxLength);
    if (error) return error;
  }

  if (rules.min && !isNaN(numericValue)) {
    const error = ValidationHelpers.min(numericValue, rules.min);
    if (error) return error;
  }

  if (rules.max && !isNaN(numericValue)) {
    const error = ValidationHelpers.max(numericValue, rules.max);
    if (error) return error;
  }

  if (rules.pattern && stringValue) {
    const error = ValidationHelpers.pattern(stringValue, rules.pattern);
    if (error) return error;
  }

  if (rules.validate) {
    const error = await ValidationHelpers.custom(value, rules.validate);
    if (error) return error;
  }

  return null;
}

export function form(config: FormConfig = {}) {
  const { defaultValues = {}, mode = "onBlur" } = config;

  return {
    values: { ...defaultValues },
    errors: {} as Record<string, string>,
    touched: {} as Record<string, boolean>,
    isSubmitting: false,
    isValid: true,
    mode,
    fieldRules: {} as Record<string, ValidationRules>,

    register(name: string, rules?: ValidationRules) {
      this.values[name] ??= "";
      this.fieldRules[name] = rules || {};
      return {
        name,
        "x-model": `values.${name}`,
        ":class": `{ 'kecom-input-error': errors.${name} }`,
        ":aria-invalid": `!!errors.${name}`,
        "@blur": mode === "onBlur" || mode === "onChange" ? `handleBlur('${name}')` : null,
        "@input": mode === "onChange" ? `handleInput('${name}', $event.target.value)` : null,
      };
    },

    // Apply to the .kecom-field wrapper div to toggle error state class
    fieldWrapper(name: string) {
      return {
        ":class": `{ 'kecom-field-error-state': errors.${name} }`,
      };
    },

    handleInput(name: string, value: unknown) {
      this.values[name] = value;
      if (this.mode === "onChange") {
        this.validateField(name);
      }
    },

    handleBlur(name: string) {
      this.touched[name] = true;
      if (this.mode === "onBlur" || this.mode === "onChange") {
        this.validateField(name);
      }
    },

    async validateField(name: string) {
      const error = await validateField(this.values[name], this.fieldRules[name]);
      if (error) {
        this.errors[name] = error;
      } else {
        delete this.errors[name];
      }
      this.updateIsValid();
    },

    async validateForm() {
      const fieldNames = Object.keys(this.values);
      for (const name of fieldNames) {
        await this.validateField(name);
      }
      return this.isValid;
    },

    updateIsValid() {
      this.isValid = Object.keys(this.errors).length === 0;
    },

    clearErrors() {
      this.errors = {};
      this.updateIsValid();
    },

    setError(name: string, message: string) {
      this.errors[name] = message;
      this.updateIsValid();
    },

    setValue(name: string, value: unknown) {
      this.values[name] = value;
    },

    getValue(name: string): unknown {
      return this.values[name];
    },

    reset() {
      this.values = { ...defaultValues };
      this.errors = {};
      this.touched = {};
      this.isSubmitting = false;
      this.isValid = true;
    },

    async handleSubmit(onValid: (data: Record<string, unknown>) => void | Promise<void>, onInvalid?: () => void) {
      this.isSubmitting = true;
      this.touched = Object.keys(this.values).reduce((acc, key) => ({ ...acc, [key]: true }), {});

      try {
        await this.validateForm();
        if (this.isValid) {
          await onValid({ ...this.values });
        } else {
          onInvalid?.();
        }
      } finally {
        this.isSubmitting = false;
      }
    },

    getFormState(): FormState {
      return {
        values: { ...this.values },
        errors: { ...this.errors },
        touched: { ...this.touched },
        isSubmitting: this.isSubmitting,
        isValid: this.isValid,
      };
    },
  };
}

/**
 * Alpine component: stateField
 * Handles country→state dropdown population for address forms.
 * Must be used inside a form() scope so it can watch values.country
 * and read values.state via the parent form's register() binding.
 *
 * PHP usage:
 *   <div x-data="stateField()">
 *     <select x-bind="register('state', { required: '...' })">
 *       <template x-for="state in states" :key="state.id">
 *         <option :value="state.id" x-text="state.name"></option>
 *       </template>
 *     </select>
 *   </div>
 */
export function stateField({ notifyAddressChange = false }: { notifyAddressChange?: boolean } = {}) {
  return {
    states: [] as Array<{ id: string; name: string }>,

    init() {
      const loadStates = (countryCode: string) => {
        if (!countryCode) {
          this.states = [];
          return;
        }
        const countries: Array<{ code: string; states: Array<{ id: string; name: string }> }> = config.countries ?? [];
        const country = countries.find((c) => c.code === countryCode);
        this.states = country?.states || [];
      };

      // Watch parent form's country value
      (this as any).$watch("values.country", (newCountry: string) => {
        loadStates(newCountry);
        if (notifyAddressChange) {
          window.dispatchEvent(new CustomEvent("address-changed"));
        }
      });

      // Watch parent form's state value
      if (notifyAddressChange) {
        (this as any).$watch("values.state", () => {
          window.dispatchEvent(new CustomEvent("address-changed"));
        });
      }

      // Populate states for the current country immediately
      const currentCountry = (this as any).values?.country ?? "";
      loadStates(currentCountry);

      // Re-assert the saved state value after x-for stamps the options
      (this as any).$nextTick(() =>
        (this as any).$nextTick(() => {
          const select = (this as any).$el.querySelector("select");
          const savedState = (this as any).values?.state ?? "";
          if (select && savedState) {
            select.value = savedState;
          }
        }),
      );
    },
  };
}
