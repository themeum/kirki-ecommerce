type TranslateText = (text: string, domain?: string) => string;
type TranslateContext = (
  text: string,
  context: string,
  domain?: string,
) => string;
type TranslatePlural = (
  single: string,
  plural: string,
  number: number,
  domain?: string,
) => string;
type TranslatePluralContext = (
  single: string,
  plural: string,
  number: number,
  context: string,
  domain?: string,
) => string;
type SprintfFn = (format: string, ...args: (string | number)[]) => string;
type SetLocaleDataFn = (
  data: Record<string, unknown>,
  domain?: string,
) => void;
type GetLocaleDataFn = (domain?: string) => Record<string, unknown>;

type I18nModule = {
  __?: TranslateText;
  _x?: TranslateContext;
  _n?: TranslatePlural;
  _nx?: TranslatePluralContext;
  sprintf?: SprintfFn;
  setLocaleData?: SetLocaleDataFn;
  getLocaleData?: GetLocaleDataFn;
};

const i18n: I18nModule = window?.wp?.i18n || {};

export const __: TranslateText = i18n.__ ?? ((s) => s);
export const _x: TranslateContext = i18n._x ?? ((s) => s);
export const _n: TranslatePlural = i18n._n ?? ((s) => s);
export const _nx: TranslatePluralContext = i18n._nx ?? ((s) => s);
export const sprintf: SprintfFn =
  i18n.sprintf ?? ((...args) => args.join(' '));
export const setLocaleData: SetLocaleDataFn = i18n.setLocaleData ?? (() => {});
export const getLocaleData: GetLocaleDataFn = i18n.getLocaleData ?? (() => ({}));
