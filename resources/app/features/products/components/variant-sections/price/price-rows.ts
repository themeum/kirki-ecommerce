import type { VariantFieldsInput } from '@/features/products/schemas/forms/variant-fields';

type PriceRow = 'sale' | 'unit' | 'cost';

const toAmount = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = Number(value);

  return Number.isFinite(amount) ? amount : null;
};

/**
 * The whole-percent discount a sale price represents, or null when there is no
 * genuine discount to summarise — an absent, zero or non-positive price, or a
 * sale price that is not strictly below it.
 */
const calculateDiscountPercentage = (basePrice: unknown, salePrice: unknown): number | null => {
  const price = toAmount(basePrice);
  const sale = toAmount(salePrice);

  if (price === null || sale === null || price <= 0 || sale <= 0 || sale >= price) {
    return null;
  }

  return Math.round((1 - sale / price) * 100);
};

const hasValue = (value: unknown): boolean => {
  return value !== null && value !== undefined && value !== '';
};

/**
 * Which optional rows a variant already holds data for. Used to decide what is
 * open when the card first sees a populated form — never to keep visibility in
 * sync afterwards, which would pull a field out from under the merchant.
 */
const getInitialOpenRows = (values: Partial<VariantFieldsInput>): PriceRow[] => {
  const rows: PriceRow[] = [];

  if (hasValue(values.base_sale_price)) {
    rows.push('sale');
  }

  if (
    hasValue(values.total_unit_amount) ||
    hasValue(values.total_unit) ||
    hasValue(values.base_unit_amount) ||
    hasValue(values.base_unit)
  ) {
    rows.push('unit');
  }

  if (hasValue(values.base_cost_of_goods)) {
    rows.push('cost');
  }

  return rows;
};

export { calculateDiscountPercentage, getInitialOpenRows, type PriceRow };
