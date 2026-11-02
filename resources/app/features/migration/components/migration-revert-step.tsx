import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import MigrationStepLayout from '@/features/migration/components/migration-step-layout';
import type { MigrationRevertProgress } from '@/features/migration/schemas/catalog/migration';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type MigrationRevertStepProps = {
  progress: MigrationRevertProgress | null;
  isFailed: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
};

const MigrationRevertStep = ({
  progress,
  isFailed,
  errorMessage,
  onRetry,
}: MigrationRevertStepProps) => {
  const handled = progress ? progress.removed + progress.kept : 0;

  return (
    <MigrationStepLayout
      title={__('Reverting your migration', 'kirki-ecommerce')}
      subtitle={__('Keep this page open until the revert is finished.', 'kirki-ecommerce')}
      footer={
        isFailed && (
          <Button size="lg" onClick={onRetry}>
            {__('Retry', 'kirki-ecommerce')}
          </Button>
        )
      }
    >
      <Flex gap={3} align="center">
        {!isFailed && <Spinner cssOverride={styles.spinner} />}
        <Text color="secondary">
          {progress
            ? sprintf(
                /* translators: 1: number of records handled. 2: total number of records. */
                __('%1$d of %2$d records handled', 'kirki-ecommerce'),
                handled,
                progress.total,
              )
            : __('Preparing the revert…', 'kirki-ecommerce')}
        </Text>
      </Flex>
      {isFailed && (
        <Alert type="fail" text={errorMessage ?? __('The revert stopped.', 'kirki-ecommerce')} />
      )}
    </MigrationStepLayout>
  );
};

MigrationRevertStep.displayName = 'MigrationRevertStep';

export default MigrationRevertStep;

const styles = defineStyles({
  spinner: {
    width: '20px',
    height: '20px',
    color: theme.colors.icon.brand,
    '& svg': {
      width: '20px',
      height: '20px',
    },
  },
});
