import { css, type CSSObject, type Theme } from '@emotion/react';

const APP_ROOT_SELECTOR = '#wpbody-content .kirki-ecommerce-root';

/**
 * Scope Emotion styles under the app root so they beat the normalize button/input resets.
 *
 * @param styles CSS object to apply to the element.
 *
 * @returns Emotion css styles nested under the app root selector.
 */
const scoped = (styles: CSSObject) => {
  return css({
    [`${APP_ROOT_SELECTOR} &`]: styles,
  });
};

/**
 * Flexbox centering utility matching the SCSS flexCenter mixin.
 *
 * @returns CSS object for centered flex layout.
 */
const flex_center = (): CSSObject => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
};

/**
 * Focus ring utility matching the SCSS ui-focus-ring mixin.
 *
 * @param theme Current Emotion theme.
 * @param ring_color Optional ring color override.
 *
 * @returns CSS object for the focus ring box-shadow.
 */
const ui_focus_ring = (theme: Theme, ring_color?: string): CSSObject => {
  const color = ring_color ?? theme.colors.border.ring;

  return {
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.colors.background.fill}, 0 0 0 4px ${color}`,
  };
};

export { APP_ROOT_SELECTOR, scoped, flex_center, ui_focus_ring };
