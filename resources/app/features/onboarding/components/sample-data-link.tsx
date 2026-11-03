import type { CSSProperties } from 'react';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SampleDataLinkProps = {
  phase: 'idle' | 'downloading' | 'done';
  progress: number;
  isDisabled: boolean;
  onLoad: () => void;
};

const SampleDataLink = ({ phase, progress, isDisabled, onLoad }: SampleDataLinkProps) => {
  const progressText = __('Downloading sample data...', 'kirki-ecommerce');

  return (
    <Flex justify="center" align="center" cssOverride={styles.root}>
      {phase === 'idle' ? (
        <Button variant="link" onClick={onLoad} disabled={isDisabled} cssOverride={styles.link}>
          {__('Click here to load sample data!', 'kirki-ecommerce')}
        </Button>
      ) : (
        <Flex direction="column" gap={2} align="center">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={progressText}
            css={scoped(styles.track)}
          >
            <div
              css={scoped(styles.fill)}
              style={{ '--sample-data-progress-width': `${progress}%` } as CSSProperties}
            />
          </div>
          <Text color="subdued" variant="small">
            {progressText}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

SampleDataLink.displayName = 'SampleDataLink';

export default SampleDataLink;

const styles = defineStyles({
  root: {
    width: '100%',
    minHeight: '32px',
    marginTop: '-12px',
  },
  link: {
    color: theme.colors.text.subdued,
    textDecoration: 'underline',
    ...theme.typography.small('medium'),
  },
  track: {
    width: '174px',
    height: '4px',
    overflow: 'hidden',
    backgroundColor: theme.colors.background.surfaceSecondary,
    borderRadius: theme.radius.full,
  },
  fill: {
    height: '100%',
    width: 'var(--sample-data-progress-width)',
    backgroundColor: theme.colors.background.fillBrand,
    borderRadius: 'inherit',
    transition: 'width 0.1s linear',
  },
});
