import type {
  GeneralTaxRegion,
  StateTaxRate,
  TaxRegion,
  TaxRegionState,
} from '@/features/settings/tax/shared/lib/utils';

/**
 * Appends a zero-rate entry for each newly picked state, keyed by the state's
 * id (never its name), skipping any id that already has one. A state carries
 * no flag — the country dataset has none for any state.
 */
export const addStatesToRegion = (
  states: StateTaxRate[],
  selectedStates: TaxRegionState[],
): StateTaxRate[] => {
  const existing = new Set(states.map((state) => String(state.id)));
  const additions = selectedStates
    .filter((state) => {
      const id = String(state.id);
      return id && !existing.has(id);
    })
    .map<StateTaxRate>((state) => ({
      id: String(state.id),
      name: state.name ?? state.title,
      product_tax_rate: 0,
      shipping_tax_rate: 0,
      rules: [],
    }));

  return [...states, ...additions];
};

/**
 * Writes a general region's central-tax / per-state fields back into the
 * region list, leaving every other region untouched. `payload` is the general
 * form's transformed output; `rules`, `name` and `flag` are preserved.
 */
export const applyRegionTaxUpdate = (
  regions: TaxRegion[],
  code: string,
  payload: {
    is_central_tax_enabled?: boolean;
    central_product_tax?: number | string | null;
    central_shipping_tax?: number | string | null;
    states?: StateTaxRate[];
  },
): TaxRegion[] =>
  regions.map((region) =>
    region.code === code
      ? {
          ...region,
          is_central_tax_enabled: payload.is_central_tax_enabled,
          central_product_tax: payload.central_product_tax,
          central_shipping_tax: payload.central_shipping_tax,
          states: payload.states ?? [],
        }
      : region,
  );

/**
 * Patches one state of one general region — the state page's save path, which
 * only ever touches the state it is editing.
 */
export const updateRegionState = (
  regions: TaxRegion[],
  code: string,
  stateId: string,
  patch: Partial<StateTaxRate>,
): TaxRegion[] =>
  regions.map((region) => {
    if (region.code !== code) {
      return region;
    }

    const states = (region as GeneralTaxRegion).states ?? [];

    return {
      ...region,
      states: states.map((state) =>
        String(state.id) === String(stateId) ? { ...state, ...patch } : state,
      ),
    };
  });
