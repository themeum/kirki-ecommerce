import { keyframes, type CSSObject, type Theme } from '@emotion/react';

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
  const surfaceTertiary = theme.colors.background.surfaceTertiary;

  return {
    '#wpcontent': {
      backgroundColor: surfaceTertiary,
    },
    [APP_ROOT_SELECTOR]: {
      marginLeft: '-20px',
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
  };
};

export { getShellStyles, pageEnterKeyframes };
