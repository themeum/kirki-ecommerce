const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 'A'.charCodeAt(0);

const SUPRANATIONAL_FLAG_REGIONS = ['EU'];

const toFlagEmoji = (region: string) =>
  String.fromCodePoint(...[...region].map((letter) => letter.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET));

const getCurrencyFlag = (currencyCode: string, knownCountryCodes: readonly string[]): string => {
  const region = currencyCode.slice(0, 2).toUpperCase();

  if (!/^[A-Z]{2}$/.test(region)) {
    return '';
  }

  if (!knownCountryCodes.includes(region) && !SUPRANATIONAL_FLAG_REGIONS.includes(region)) {
    return '';
  }

  return toFlagEmoji(region);
};

export { getCurrencyFlag };
