import { css, Global } from '@emotion/react';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import {
  COMPLETION_STEP,
  getStepTitle,
  type OnboardingStep,
} from '@/features/onboarding/lib/steps';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type OnboardingShellProps = {
  step: OnboardingStep;
  stepCount: number;
  children: ReactNode;
  afterCard?: ReactNode;
};

const OnboardingShell = ({ step, stepCount, children, afterCard }: OnboardingShellProps) => {
  const isCompletion = step === COMPLETION_STEP;
  const progress = isCompletion ? 100 : (step / stepCount) * 100;

  return (
    <div css={scoped(styles.overlay)}>
      <Global styles={hideAdminChrome} />
      <div css={scoped(styles.column)}>
        <img
          src={`${window.kirki_ecommerce.assets_url}/images/kirki-ecommerce.svg`}
          alt={__('Kirki eCommerce', 'kirki-ecommerce')}
          css={scoped(styles.logo)}
        />
        <Flex direction="column" gap={6} cssOverride={styles.body}>
          <Flex direction="column" gap={2}>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              css={scoped(styles.track)}
            >
              <div css={scoped(styles.fill)} style={{ width: `${progress}%` }} />
            </div>
            <Flex justify="space-between">
              <Text variant="small" color="secondary">
                {!isCompletion && sprintf(__('Step %d', 'kirki-ecommerce'), step + 1)}
              </Text>
              <Text variant="small" color="secondary">
                {getStepTitle(step)}
              </Text>
            </Flex>
          </Flex>
          <Card cssOverride={styles.card}>{children}</Card>
          {afterCard}
        </Flex>
      </div>
    </div>
  );
};

OnboardingShell.displayName = 'OnboardingShell';

export default OnboardingShell;

const hideAdminChrome = css({
  'html.wp-toolbar': {
    paddingTop: 0,
  },
  '#wpadminbar, #adminmenumain, #wpfooter': {
    display: 'none',
  },
});

const styles = defineStyles({
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: theme.zIndex.fullscreen,
    display: 'flex',
    overflowY: 'auto',
    padding: `${theme.spacing[12]} ${theme.spacing[4]}`,
    backgroundColor: theme.colors.background.solidSurfaceSecondary,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing[12],
    width: '100%',
    maxWidth: '440px',
    margin: '64px auto',
  },
  logo: {
    display: 'block',
    height: '20px',
    width: 'auto',
  },
  body: {
    width: '100%',
  },
  track: {
    width: '100%',
    height: '4px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border.default,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.fillBrand,
    transition: 'width 200ms ease',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minHeight: '360px',
    padding: theme.spacing[6],
    borderRadius: theme.radius.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    boxShadow: '0px -1px 1px 0.5px #0000001A inset, 0px 0.5px 1px 0px #0000001A inset',
  },
});
