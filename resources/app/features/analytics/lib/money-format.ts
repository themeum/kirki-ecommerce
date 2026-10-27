const getFractionDigits = (currencyCode: string): number => {
  try {
    const options = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).resolvedOptions();

    return options.maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
};

const createMinorFormatter = (currencyCode: string) => {
  const digits = getFractionDigits(currencyCode);
  let formatter: Intl.NumberFormat;

  try {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode });
  } catch {
    formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: digits });
  }

  return (minorAmount: number) => formatter.format(minorAmount / 10 ** digits);
};

const createCompactMinorFormatter = (currencyCode: string) => {
  const digits = getFractionDigits(currencyCode);
  const options: Intl.NumberFormatOptions = {
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  };
  let formatter: Intl.NumberFormat;

  try {
    formatter = new Intl.NumberFormat('en-US', {
      ...options,
      style: 'currency',
      currency: currencyCode,
    });
  } catch {
    formatter = new Intl.NumberFormat('en-US', options);
  }

  return (minorAmount: number) => formatter.format(minorAmount / 10 ** digits);
};

export { createCompactMinorFormatter, createMinorFormatter };
