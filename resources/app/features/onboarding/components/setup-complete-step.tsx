import { Check } from 'lucide-react';

import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import StepLayout from '@/features/onboarding/components/step-layout';
import type { SetupRowState } from '@/features/onboarding/hooks/use-staggered-rows';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SetupSummaryRow = {
  label: string;
  value: string;
};

type SetupCompleteStepProps = {
  rows: SetupSummaryRow[];
  rowStates: SetupRowState[];
  isReady: boolean;
  isFailed: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onAddFirstProduct: () => void;
  onGoToDashboard: () => void;
};

const SetupCompleteStep = ({
  rows,
  rowStates,
  isReady,
  isFailed,
  errorMessage,
  onRetry,
  onAddFirstProduct,
  onGoToDashboard,
}: SetupCompleteStepProps) => {
  return (
    <StepLayout
      title={__('Your store is almost ready', 'kirki-ecommerce')}
      subtitle={__("Here's what we set up for you.", 'kirki-ecommerce')}
      footer={
        isFailed ? (
          <Button size="lg" onClick={onRetry}>
            {__('Try again', 'kirki-ecommerce')}
          </Button>
        ) : (
          <Grid columns={2} gap={3}>
            <Button size="lg" onClick={onAddFirstProduct} disabled={!isReady}>
              {__('Add your first product', 'kirki-ecommerce')}
            </Button>
            <Button variant="outline" size="lg" onClick={onGoToDashboard} disabled={!isReady}>
              {__('Go to Dashboard', 'kirki-ecommerce')}
            </Button>
          </Grid>
        )
      }
    >
      <Flex direction="column" gap={2}>
        {rows.map((row, index) => (
          <Flex key={row.label} gap={3} align="center">
            <SetupRowIcon state={rowStates[index] ?? 'waiting'} />
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
      {isFailed && (
        <Alert type="fail" text={errorMessage ?? __('Store setup failed.', 'kirki-ecommerce')} />
      )}
    </StepLayout>
  );
};

SetupCompleteStep.displayName = 'SetupCompleteStep';

const SetupRowIcon = ({ state }: { state: SetupRowState }) => {
  if (state === 'in-progress') {
    return (
      <span css={scoped(styles.icon)}>
        <Spinner cssOverride={styles.spinner} />
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
export type { SetupSummaryRow };

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
  spinner: {
    width: '20px',
    height: '20px',
    color: theme.colors.icon.brand,
    '& svg': {
      width: '20px',
      height: '20px',
    },
  },
  success: {
    backgroundColor: theme.colors.background.fillSuccessSecondary,
    color: theme.colors.icon.success,
  },
  idle: {
    color: theme.colors.icon.secondary,
  },
});
