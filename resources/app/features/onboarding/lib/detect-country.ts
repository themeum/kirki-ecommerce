import { TIMEZONE_COUNTRIES } from '@/features/onboarding/lib/timezone-countries';

type DetectCountryEnvironment = {
  timeZone?: string;
  languages?: readonly string[];
};

const readBrowserEnvironment = (): DetectCountryEnvironment => {
  let timeZone: string | undefined;

  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }

  const languages = typeof navigator !== 'undefined' ? navigator.languages : undefined;

  return { timeZone, languages };
};

const getLanguageRegion = (language: string | undefined) => {
  if (!language) {
    return undefined;
  }

  try {
    return new Intl.Locale(language).region;
  } catch {
    return undefined;
  }
};

const detectCountry = (
  knownCountryCodes: readonly string[],
  environment: DetectCountryEnvironment = readBrowserEnvironment(),
): string => {
  const candidates = [
    environment.timeZone ? TIMEZONE_COUNTRIES[environment.timeZone] : undefined,
    getLanguageRegion(environment.languages?.[0]),
  ];

  const detected = candidates.find(
    (code): code is string => code !== undefined && knownCountryCodes.includes(code),
  );

  return detected ?? '';
};

export { detectCountry };
