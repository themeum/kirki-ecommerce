import { type CSSObject, type Theme } from '@emotion/react';

import { APP_ROOT_SELECTOR } from '@/theme/mixins';

const FORM_CONTROL_TYPES = [
  'text',
  'password',
  'color',
  'date',
  'datetime',
  'datetime-local',
  'email',
  'month',
  'number',
  'search',
  'tel',
  'time',
  'url',
  'week',
  'file',
] as const;

/**
 * Build form control selectors for a given pseudo-class suffix.
 *
 * @param suffix Optional pseudo-class suffix such as ":focus".
 *
 * @returns Comma-separated selector list for text-like inputs, select, and textarea.
 */
const form_control_selectors = (suffix = ''): string => {
  const input_selectors = FORM_CONTROL_TYPES.map(
    (type) => `input[type="${type}"]${suffix}`,
  );

  return [...input_selectors, `select${suffix}`, `textarea${suffix}`].join(', ');
};

/**
 * Port of styles/normalize.scss into an Emotion CSS object scoped to the app root.
 *
 * @param theme Current Emotion theme.
 *
 * @returns CSS object keyed by the app root selector.
 */
const get_normalize_styles = (theme: Theme): CSSObject => {
  return {
    [APP_ROOT_SELECTOR]: {
      '*, *::before, *::after': {
        boxSizing: 'border-box',
      },
      margin: 0,
      padding: 0,
      color: theme.colors.text.primary,
      fontSize: '14px',
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontWeight: 400,
      lineHeight: '21px',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      textRendering: 'optimizeLegibility',
      'h1, h2, h3, h4, h5, h6': {
        margin: 0,
        padding: 0,
        fontSize: 'inherit',
        fontWeight: 'inherit',
        lineHeight: 'inherit',
        color: 'inherit',
      },
      'p, blockquote, pre, figure, figcaption, dl, dd, dt': {
        margin: 0,
        padding: 0,
      },
      'ul, ol': {
        margin: 0,
        padding: 0,
        listStyle: 'none',
      },
      li: {
        margin: 0,
        padding: 0,
      },
      a: {
        color: 'inherit',
        textDecoration: 'none',
        backgroundColor: 'transparent',
        '&:hover, &:active': {
          color: 'inherit',
        },
      },
      'img, svg, video, canvas, audio, iframe, embed, object': {
        display: 'block',
        maxWidth: '100%',
      },
      'img, video': {
        height: 'auto',
      },
      svg: {
        overflow: 'hidden',
      },
      table: {
        borderCollapse: 'collapse',
        borderSpacing: 0,
        width: '100%',
      },
      'th, td': {
        padding: 0,
        textAlign: 'left',
        fontWeight: 'inherit',
        verticalAlign: 'middle',
      },
      hr: {
        margin: 0,
        padding: 0,
        border: 0,
        borderTop: `1px solid ${theme.colors.border.default}`,
        height: 0,
      },
      'button, input, optgroup, select, textarea': {
        margin: 0,
        padding: 0,
        fontFamily: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        lineHeight: 'inherit',
        color: 'inherit',
        background: 'none',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: 0,
        boxShadow: 'none',
        outline: 'none',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        minHeight: 0,
        maxWidth: '100%',
        verticalAlign: 'middle',
      },
      [form_control_selectors()]: {
        margin: 0,
        padding: 0,
        minHeight: 0,
        lineHeight: 'inherit',
        border: 'none',
        borderRadius: 0,
        background: 'none',
        backgroundColor: 'transparent',
        color: 'inherit',
        boxShadow: 'none',
        outline: 'none',
      },
      [form_control_selectors(':focus')]: {
        borderColor: 'transparent',
        boxShadow: 'none',
        outline: 'none',
      },
      [form_control_selectors(':focus-visible')]: {
        borderColor: 'transparent',
        boxShadow: 'none',
        outline: 'none',
      },
      [form_control_selectors(':active')]: {
        borderColor: 'transparent',
        boxShadow: 'none',
        outline: 'none',
      },
      'button, input[type="button"], input[type="reset"], input[type="submit"]': {
        cursor: 'pointer',
        background: 'transparent',
        border: 'none',
        padding: 0,
        boxShadow: 'none',
        minHeight: 0,
        '&:hover, &:focus, &:active, &:focus-visible': {
          outline: 'none',
        },
      },
      'button:disabled, input[type="button"]:disabled, input[type="reset"]:disabled, input[type="submit"]:disabled, input:disabled, select:disabled, textarea:disabled':
        {
          cursor: 'not-allowed',
        },
      'input[type="search"]': {
        WebkitAppearance: 'none',
        appearance: 'none',
        '&::-webkit-search-cancel-button, &::-webkit-search-decoration, &::-webkit-search-results-button, &::-webkit-search-results-decoration':
          {
            display: 'none',
            WebkitAppearance: 'none',
          },
      },
      'input[type="number"]': {
        MozAppearance: 'textfield',
        '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
          WebkitAppearance: 'none',
          margin: 0,
        },
      },
      'input[type="checkbox"], input[type="radio"]': {
        width: 'auto',
        height: 'auto',
        minWidth: 0,
        margin: 0,
        padding: 0,
        border: 'none',
        borderRadius: 0,
        background: 'none',
        boxShadow: 'none',
        clear: 'none',
        '&:focus, &:focus-visible': {
          borderColor: 'transparent',
          boxShadow: 'none',
          outline: 'none',
        },
        '&:checked::before': {
          content: 'none',
          display: 'none',
        },
      },
      'input[type="file"]': {
        cursor: 'pointer',
      },
      textarea: {
        resize: 'vertical',
        overflow: 'auto',
      },
      select: {
        backgroundImage: 'none',
        lineHeight: 'inherit',
        '&::-ms-expand': {
          display: 'none',
        },
      },
      label: {
        margin: 0,
        padding: 0,
        fontWeight: 'inherit',
        cursor: 'pointer',
      },
      fieldset: {
        margin: 0,
        padding: 0,
        border: 'none',
        minWidth: 0,
      },
      legend: {
        margin: 0,
        padding: 0,
        border: 'none',
      },
      'strong, b': {
        fontWeight: 600,
      },
      'em, i': {
        fontStyle: 'italic',
      },
      small: {
        fontSize: '0.875em',
      },
      'code, kbd, samp, pre': {
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '1em',
      },
      '[hidden]': {
        display: 'none !important',
      },
      ':focus:not(:focus-visible)': {
        outline: 'none',
      },
    },
  };
};

export { get_normalize_styles };
