type RateInput = number | string | null | undefined;

const toRate = (value: RateInput): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const rate = Number(value);

  return Number.isFinite(rate) ? rate : null;
};

/**
 * The percentage shown for a region in the region list. A region that charges
 * one rate reads `20%`; one whose sub-territories differ reads `5–20%`. An
 * unconfigured rate is absent, not zero — a stored `0` is a rate and reads
 * `0%`.
 */
export const formatTaxRateLabel = (rates: RateInput[]): string => {
  const values = rates.map(toRate).filter((rate): rate is number => rate !== null);

  if (!values.length) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return min === max ? `${min}%` : `${min}–${max}%`;
};
