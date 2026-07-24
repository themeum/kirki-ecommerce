import { css, type CSSObject, type Theme } from '@emotion/react';

const APP_ROOT_SELECTOR = '#wpbody-content .kirki-ecommerce-root';

/**
 * Scope Emotion styles under the app root so they beat the normalize button/input resets.
 * Uses `&&` to raise specificity above typed form-control selectors (e.g. input[type="text"]).
 *
 * @param styles CSS object to apply to the element.
 *
 * @returns Emotion css styles nested under the app root selector.
 */
const scoped = (styles: CSSObject) => {
  return css({
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

/**
 * Typography defaults matching the SCSS fontGeneralSettings mixin.
 *
 * @param theme Current Emotion theme.
 *
 * @returns CSS object for base body text styling.
 */
const fontGeneralSettings = (theme: Theme): CSSObject => {
  return {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.lineHeight.base,
    color: theme.colors.text.primary,
  };
};

export {
  APP_ROOT_SELECTOR, flexCenter, fontGeneralSettings, itemCenter, scoped, uiFocusRing
};

