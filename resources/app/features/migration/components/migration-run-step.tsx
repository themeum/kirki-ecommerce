import { Check, CircleAlert } from 'lucide-react';

import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import MigrationStepLayout from '@/features/migration/components/migration-step-layout';
import type { MigrationGroupState } from '@/features/migration/schemas/catalog/migration';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type MigrationRunStepProps = {
  groups: Record<string, MigrationGroupState>;
  isFailed: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
};

const MigrationRunStep = ({ groups, isFailed, errorMessage, onRetry }: MigrationRunStepProps) => {
  return (
    <MigrationStepLayout
      title={__('Migrating your data', 'kirki-ecommerce')}
      subtitle={__('Keep this page open until the migration is finished.', 'kirki-ecommerce')}
      footer={
        isFailed && (
          <Button size="lg" onClick={onRetry}>
            {__('Retry', 'kirki-ecommerce')}
          </Button>
        )
      }
    >
      <Flex direction="column" gap={3}>
        {Object.entries(groups).map(([id, state]) => (
          <Flex key={id} gap={3} align="center">
            <GroupIcon state={state} isFailed={isFailed} />
            <Text weight="medium">{state.label}</Text>
            <Text color="subdued">·</Text>
            <Text color="subdued">{`${Math.min(state.done, state.total)} / ${state.total}`}</Text>
          </Flex>
        ))}
      </Flex>
      {isFailed && (
        <Alert
          type="fail"
          text={errorMessage ?? __('The migration stopped.', 'kirki-ecommerce')}
        />
      )}
    </MigrationStepLayout>
  );
};

MigrationRunStep.displayName = 'MigrationRunStep';

const GroupIcon = ({ state, isFailed }: { state: MigrationGroupState; isFailed: boolean }) => {
  if (state.status === 'done') {
    return (
      <span css={scopedMerge(styles.icon, styles.success)}>
        <Check size={12} strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }

  if (isFailed && (state.status === 'failed' || state.status === 'running')) {
    return (
      <span css={scopedMerge(styles.icon, styles.failure)}>
        <CircleAlert size={16} aria-hidden="true" />
      </span>
    );
  }

  if (state.status === 'running') {
    return (
      <span css={scoped(styles.icon)}>
        <Spinner cssOverride={styles.spinner} />
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

GroupIcon.displayName = 'GroupIcon';

export default MigrationRunStep;

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
  failure: {
    color: theme.colors.icon.critical,
  },
  idle: {
    color: theme.colors.icon.secondary,
  },
});
