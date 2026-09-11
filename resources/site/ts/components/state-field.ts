/**
 * Alpine component: stateField
 * Handles country→state dropdown population for address forms in checkout.
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

import { emit, EVENTS } from '../events';
import { config } from '../utils';

export function stateField({
  notifyAddressChange = false,
}: { notifyAddressChange?: boolean } = {}) {
  return {
    states: [] as { id: string; name: string }[],

    init() {
      const loadStates = (countryCode: string) => {
        if (!countryCode) {
          this.states = [];
          return;
        }
        const countries: { code: string; states: { id: string; name: string }[] }[] =
          config.countries ?? [];
        const country = countries.find((c) => c.code === countryCode);
        this.states = country?.states ?? [];
      };

      // Watch parent form's country value
      (this as any).$watch('values.country', (newCountry: string) => {
        loadStates(newCountry);
        if ((this as any).values) {
          (this as any).values.state = '';
        }
        if ((this as any).errors?.state) {
          delete (this as any).errors.state;
        }
        if (notifyAddressChange) {
          emit(EVENTS.ADDRESS_CHANGED);
        }
      });

      // Watch parent form's state value
      if (notifyAddressChange) {
        (this as any).$watch('values.state', () => {
          emit(EVENTS.ADDRESS_CHANGED);
        });
      }

      // Populate states for the current country immediately
      const currentCountry = (this as any).values?.country ?? '';
      loadStates(currentCountry);

      // Re-assert the saved state value after x-for stamps the options
      (this as any).$nextTick(() =>
        (this as any).$nextTick(() => {
          const select = (this as any).$el.querySelector('select');
          const savedState = (this as any).values?.state ?? '';
          if (select && savedState) {
            select.value = savedState;
          }
        }),
      );
    },
  };
}
