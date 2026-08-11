import { keyframes } from '@emotion/react';

import { theme } from '@/theme';
import { flexCenter, scoped, defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const LoadingSpinner = () => {
  return (
    <div
      css={scoped(styles.root)}
      role="status"
      aria-label={__('Loading page', 'kirki-ecommerce')}
    >
      <span css={scoped(styles.spinner)} />
    </div>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;

const spinnerSpin = keyframes({
  to: {
    transform: 'rotate(360deg)',
  },
});

const styles = defineStyles({
  root: {
    ...flexCenter(),
    minHeight: '200px',
    width: '100%',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: `3px solid ${theme.colors.border.secondary}`,
    borderTopColor: theme.colors.background.fillBrand,
    borderRadius: theme.radius.full,
    animation: `${spinnerSpin} 0.8s linear infinite`,
  },
});
