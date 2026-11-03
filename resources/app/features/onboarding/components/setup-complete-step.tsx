import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import ProgressRing from '@/components/ui/progress-ring';
import Text from '@/components/ui/text';
import StepLayout from '@/features/onboarding/components/step-layout';
import type { SetupRowState } from '@/features/onboarding/hooks/use-staggered-rows';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SetupSummaryRow = {
  label: string;
  value: string;
  percent?: number;
};

type SetupFooterMode = 'hidden' | 'retry-setup' | 'retry-migration' | 'dashboard-only' | 'default';

type SetupCompleteStepProps = {
  rows: SetupSummaryRow[];
  rowStates: SetupRowState[];
  footerMode: SetupFooterMode;
  errorMessage?: string;
  isActionDisabled?: boolean;
  onRetry: () => void;
  onAddFirstProduct: () => void;
  onGoToDashboard: () => void;
};

const SetupCompleteStep = ({
  rows,
  rowStates,
  footerMode,
  errorMessage,
  isActionDisabled = false,
  onRetry,
  onAddFirstProduct,
  onGoToDashboard,
}: SetupCompleteStepProps) => {
  return (
    <StepLayout
      title={__('Your store is almost ready', 'kirki-ecommerce')}
      subtitle={__("Here's what we set up for you.", 'kirki-ecommerce')}
      footer={
        <>
          {footerMode === 'retry-setup' && (
            <Button size="lg" onClick={onRetry}>
              {__('Try again', 'kirki-ecommerce')}
            </Button>
          )}
          {footerMode === 'retry-migration' && (
            <Grid columns={2} gap={3}>
              <Button size="lg" onClick={onRetry}>
                {__('Retry', 'kirki-ecommerce')}
              </Button>
              <Button variant="outline" size="lg" onClick={onGoToDashboard}>
                {__('Go to Dashboard', 'kirki-ecommerce')}
              </Button>
            </Grid>
          )}
          {footerMode === 'dashboard-only' && (
            <Button size="lg" onClick={onGoToDashboard}>
              {__('Go to Dashboard', 'kirki-ecommerce')}
            </Button>
          )}
          {footerMode === 'default' && (
            <Grid columns={2} gap={3}>
              <Button size="lg" onClick={onAddFirstProduct} disabled={isActionDisabled}>
                {__('Add your first product', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onGoToDashboard}
                disabled={isActionDisabled}
              >
                {__('Go to Dashboard', 'kirki-ecommerce')}
              </Button>
            </Grid>
          )}
        </>
      }
    >
      <Flex direction="column" gap={2}>
        {rows.map((row, index) => (
          <Flex key={row.label} gap={3} align="center">
            <SetupRowIcon
              state={rowStates[index] ?? 'waiting'}
              percent={row.percent}
              label={row.label}
            />
            <Text weight="medium" cssOverride={styles.rowLabel}>
              {row.label}
            </Text>
            <Text color="subdued">·</Text>
            <Text color="subdued" truncate>
              {row.value}
            </Text>
          </Flex>
        ))}
      </Flex>
      {errorMessage !== undefined && <Alert type="fail" text={errorMessage} />}
    </StepLayout>
  );
};

SetupCompleteStep.displayName = 'SetupCompleteStep';

type TimedRingProps = {
  label: string;
};

const TimedRing = ({ label }: TimedRingProps) => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPercent(100));

    return () => cancelAnimationFrame(frame);
  }, []);

  return <ProgressRing percent={percent} label={label} />;
};

TimedRing.displayName = 'TimedRing';

type SetupRowIconProps = {
  state: SetupRowState;
  percent?: number;
  label: string;
};

const SetupRowIcon = ({ state, percent, label }: SetupRowIconProps) => {
  if (state === 'in-progress') {
    return (
      <span css={scoped(styles.icon)}>
        {percent === undefined ? (
          <TimedRing label={label} />
        ) : (
          <ProgressRing percent={percent} label={label} />
        )}
      </span>
    );
  }

  if (state === 'completed') {
    return (
      <span css={scopedMerge(styles.icon, styles.success)}>
        <Check size={12} strokeWidth={3} />
      </span>
    );
  }

  return (
    <span css={scopedMerge(styles.icon, styles.idle)}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle
          cx="10"
          cy="10"
          r="7.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2.2 3.5"
        />
      </svg>
    </span>
  );
};

SetupRowIcon.displayName = 'SetupRowIcon';

export default SetupCompleteStep;
export type { SetupFooterMode, SetupSummaryRow };

const styles = defineStyles({
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '24px',
    height: '24px',
    borderRadius: theme.radius.full,
  },
  rowLabel: {
    whiteSpace: 'nowrap',
  },
  success: {
    backgroundColor: theme.colors.background.fillSuccessSecondary,
    color: theme.colors.icon.success,
  },
  idle: {
    color: theme.colors.icon.secondary,
  },
});
