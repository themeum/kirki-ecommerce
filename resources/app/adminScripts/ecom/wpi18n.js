const i18n = window?.wp?.i18n || {};

export const {
  __ = (s) => s,
  _x = (s) => s,
  _n = (s) => s,
  _nx = (s) => s,
  sprintf = (...args) => args.join(" "),
  setLocaleData = () => {},
  getLocaleData = () => ({}),
} = i18n;
