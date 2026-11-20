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

/**
 * WordPress admin shell styles ported from global.scss.
 *
 * @param theme Current Emotion theme.
 *
 * @returns CSS object for shell layout.
 */
const getShellStyles = (theme: Theme): CSSObject => {
  const notFoundBackground = theme.colors.background.surface;

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
    [`${WP_MEDIA_FRAME_SELECTOR} .media-modal`]: {
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
    },
    '.mce-floatpanel': {
      pointerEvents: 'auto',
    },
    [`#wpwrap:has(${NOT_FOUND_SELECTOR})`]: {
      backgroundColor: notFoundBackground,
    },
    [`#wpwrap:has(${NOT_FOUND_SELECTOR}) #wpcontent`]: {
      minHeight: 'calc(100vh - 32px)',
      backgroundColor: notFoundBackground,
    },
    [`#wpwrap:has(${NOT_FOUND_SELECTOR}) #wpbody`]: {
      backgroundColor: 'transparent',
    },
    [`#wpwrap:has(${NOT_FOUND_SELECTOR}) #wpbody-content`]: {
      minHeight: 'calc(100vh - 32px - 41px)',
      backgroundColor: 'transparent',
    },
    [`#wpwrap:has(${NOT_FOUND_SELECTOR}) #wpfooter`]: {
      backgroundColor: 'transparent',
    },
    [`${APP_ROOT_SELECTOR}:has(${NOT_FOUND_SELECTOR})`]: {
      minHeight: 'calc(100vh - 32px - 41px)',
      backgroundColor: 'transparent',
    },
  };
};

export { getShellStyles, pageEnterKeyframes };
