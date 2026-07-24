import { css, type CSSObject, type Theme } from '@emotion/react';

const APP_ROOT_SELECTOR = '#wpbody-content .kirki-ecommerce-root';

/**
 * Scope Emotion styles under the app root so they beat the normalize button/input resets.
 * Uses `&&` to raise specificity above typed form-control selectors (e.g. input[type="text"]).
 *
 * @param stylesOrLabel CSS object, or a debug label when a second styles argument is provided.
 * @param maybeStyles CSS object when the first argument is a debug label.
 *
 * @returns Emotion css styles nested under the app root selector.
 */
const scoped = (stylesOrLabel: CSSObject | string, maybeStyles?: CSSObject) => {
  const label = typeof stylesOrLabel === 'string' ? stylesOrLabel : undefined;
  const styles = typeof stylesOrLabel === 'string' ? (maybeStyles ?? {}) : stylesOrLabel;

  return css({
    label: import.meta.env.DEV && label ? label : undefined,
    [`${APP_ROOT_SELECTOR} &&`]: styles,
  });
};

/**
 * Flexbox centering utility matching the SCSS flexCenter mixin.
 *
 * @returns CSS object for centered flex layout.
 */
const flexCenter = (): CSSObject => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
};

/**
 * Horizontal item alignment utility matching the SCSS itemCenter mixin.
 *
 * @returns CSS object for flex row with vertically centered items.
 */
const itemCenter = (): CSSObject => {
  return {
    display: 'flex',
    alignItems: 'center',
  };
};

/**
 * Focus ring utility matching the SCSS ui-focus-ring mixin.
 *
 * @param theme Current Emotion theme.
 * @param ringColor Optional ring color override.
 *
 * @returns CSS object for the focus ring box-shadow.
 */
const uiFocusRing = (theme: Theme, ringColor?: string): CSSObject => {
  const color = ringColor ?? theme.colors.border.ring;

  return {
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.colors.background.fill}, 0 0 0 4px ${color}`,
  };
};

export {
  APP_ROOT_SELECTOR, flexCenter, itemCenter, scoped, uiFocusRing
};

