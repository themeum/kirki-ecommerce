import { keyframes, type CSSObject, type Theme } from '@emotion/react';

import { APP_PREFIX } from '@/conf';
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

/**
 * WordPress admin shell and route transition styles ported from global.scss and page-enter.scss.
 *
 * @param theme Current Emotion theme.
 *
 * @returns CSS object for shell layout and page-enter animation.
 */
const getShellStyles = (theme: Theme): CSSObject => {
  return {
    '#wpcontent': {
      backgroundColor: theme.colors.background.surfaceTertiary,
    },
    [APP_ROOT_SELECTOR]: {
      marginLeft: '-20px',
    },
    [`${APP_ROOT_SELECTOR} .${APP_PREFIX}-page-enter`]: {
      animation: `${pageEnterKeyframes} 0.45s ease-out both`,
    },
  };
};

export { getShellStyles, pageEnterKeyframes };
