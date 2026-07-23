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

/**
 * WordPress admin shell styles ported from global.scss.
 *
 * @param theme Current Emotion theme.
 *
 * @returns CSS object for shell layout.
 */
const getShellStyles = (theme: Theme): CSSObject => {
  return {
    '#wpcontent': {
      backgroundColor: theme.colors.background.surfaceTertiary,
    },
    [APP_ROOT_SELECTOR]: {
      marginLeft: '-20px',
    },
  };
};

export { getShellStyles, pageEnterKeyframes };
