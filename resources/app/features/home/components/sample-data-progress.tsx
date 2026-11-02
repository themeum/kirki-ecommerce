import type { CSSProperties } from 'react';

import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SampleDataProgressProps = {
  phase: 'downloading' | 'creating';
  progress: number;
};

const SampleDataProgress = ({ phase, progress }: SampleDataProgressProps) => {
  return (
    <>
      <span>
        {phase === 'downloading'
          ? __('Downloading product sample...', 'kirki-ecommerce')
          : __('Creating products...', 'kirki-ecommerce')}
      </span>
      <span
        aria-hidden="true"
        css={scoped(styles.fill)}
        style={{ '--sample-data-progress-width': `${progress}%` } as CSSProperties}
      />
    </>
  );
};

SampleDataProgress.displayName = 'SampleDataProgress';

export default SampleDataProgress;

const styles = defineStyles({
  fill: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: '3px',
    width: 'var(--sample-data-progress-width)',
    backgroundColor: theme.colors.background.fillBrand,
    transition: 'width 0.1s linear',
  },
});
