import { type CSSObject, keyframes, type Theme } from '@emotion/react';

import { WP_MEDIA_FRAME_SELECTOR } from '@/hooks/use-wordpress-media';
import { APP_ROOT_SELECTOR } from '@/theme/mixins';

const pageEnterKeyframes = keyframes({
  from: {
    opacity: 0,
    transform: 'translateY(12px)',
  },
  to: {
    opacity: 1,
    transform: 'translateY(0)',
  },
});

const NOT_FOUND_SELECTOR = '[data-not-found="true"]';

const TOAST_CLOSE_BUTTON_CLASS = 'kirki-ecommerce-toast-close-button';

/**
 * WordPress admin shell styles ported from global.scss.
 *
 * @param theme Current Emotion theme.
 *
 * @returns CSS object for shell layout.
 */
const getShellStyles = (theme: Theme): CSSObject => {
  const surfaceTertiary = theme.colors.background.surfaceTertiary;

  return {
    body: {
      backgroundColor: theme.colors.background.solidSurfaceSecondary,
    },
    '#wpcontent': {
      backgroundColor: theme.colors.background.solidSurfaceSecondary,
    },
    [APP_ROOT_SELECTOR]: {
      marginLeft: '-20px',
    },
    [WP_MEDIA_FRAME_SELECTOR]: {
      pointerEvents: 'auto',
    },
    '.mce-floatpanel': {
      pointerEvents: 'auto',
    },
    [`#wpwrap:has(${NOT_FOUND_SELECTOR})`]: {
      backgroundColor: surfaceTertiary,
    },
    [`#wpwrap:has(${NOT_FOUND_SELECTOR}) #wpcontent`]: {
      minHeight: 'calc(100vh - 32px)',
      backgroundColor: surfaceTertiary,
    },
    [`#wpwrap:has(${NOT_FOUND_SELECTOR}) #wpbody`]: {
      backgroundColor: surfaceTertiary,
    },
    [`#wpwrap:has(${NOT_FOUND_SELECTOR}) #wpbody-content`]: {
      minHeight: 'calc(100vh - 32px - 41px)',
      backgroundColor: surfaceTertiary,
    },
    [`#wpwrap:has(${NOT_FOUND_SELECTOR}) #wpfooter`]: {
      backgroundColor: surfaceTertiary,
    },
    [`${APP_ROOT_SELECTOR}:has(${NOT_FOUND_SELECTOR})`]: {
      minHeight: 'calc(100vh - 32px - 41px)',
      backgroundColor: surfaceTertiary,
    },
    [`[data-sonner-toast][data-styled="true"] [data-close-button="true"]`]: {
      left: 'auto',
      right: 20,
      top: '50%',
      transform: 'translate(35%, -50%)',
    },
    [`.kirki-ecommerce-root .${TOAST_CLOSE_BUTTON_CLASS}`]: {
      borderRadius: `${theme.radius.md} !important`,
      backgroundColor: 'transparent !important',
      color: `${theme.colors.icon.primary} !important`,
      '&:hover': {
        backgroundColor: `${theme.colors.background.surfaceAlt} !important`,
      },
    },
  };
};

export { getShellStyles, pageEnterKeyframes, TOAST_CLOSE_BUTTON_CLASS };
