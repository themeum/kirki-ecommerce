import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Skeleton from '@/components/ui/skeleton';
import Text from '@/components/ui/text';
import MigrationStepLayout from '@/features/migration/components/migration-step-layout';
import type { MigrationRevertResult } from '@/features/migration/hooks/use-migration-runner';
import type {
  MigrationExtension,
  MigrationGroup,
} from '@/features/migration/schemas/catalog/migration';
import { __, _n, sprintf } from '@/wpi18n';

type MigrationScanStepProps = {
  sourceLabel: string;
  isLoading: boolean;
  errorMessage?: string;
  groups: MigrationGroup[];
  extensions: MigrationExtension[];
  deselected: string[];
  revertResult?: MigrationRevertResult | null;
  onToggle: (groupId: string, isChecked: boolean) => void;
  onRetry: () => void;
  onSkip: () => void;
  onMigrate: () => void;
};

const SKELETON_ROW_COUNT = 4;

const MigrationScanStep = ({
  sourceLabel,
  isLoading,
  errorMessage,
  groups,
  extensions,
  deselected,
  revertResult,
  onToggle,
  onRetry,
  onSkip,
  onMigrate,
}: MigrationScanStepProps) => {
  const selectedCount = groups.filter((group) => !deselected.includes(group.id)).length;
  const unsupportedExtensions = extensions.filter((extension) => extension.status === 'not_migrated');

  return (
    <MigrationStepLayout
      title={sprintf(
        /* translators: %s: name of the plugin the data comes from. */
        __('Migrate from %s', 'kirki-ecommerce'),
        sourceLabel,
      )}
      subtitle={
        isLoading
          ? __('Checking your store…', 'kirki-ecommerce')
          : __('Choose the data to bring over. Nothing is deleted from your old store.', 'kirki-ecommerce')
      }
      footer={
        <Grid columns={2} gap={3}>
          <Button variant="outline" size="lg" onClick={onSkip}>
            {__('Skip', 'kirki-ecommerce')}
          </Button>
          <Button
            size="lg"
            onClick={onMigrate}
            disabled={isLoading || Boolean(errorMessage) || selectedCount === 0}
          >
            {__('Migrate', 'kirki-ecommerce')}
          </Button>
        </Grid>
      }
    >
      {isLoading && (
        <Flex direction="column" gap={3} aria-busy="true">
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <Skeleton key={index} height={24} radius="md" />
          ))}
        </Flex>
      )}
      {!isLoading && errorMessage && (
        <Flex direction="column" gap={3}>
          <Alert type="fail" text={errorMessage} />
          <Button variant="outline" onClick={onRetry}>
            {__('Try again', 'kirki-ecommerce')}
          </Button>
        </Flex>
      )}
      {!isLoading && !errorMessage && revertResult && (
        <Alert
          type={revertResult.kept > 0 ? 'warning' : 'success'}
          text={
            revertResult.kept > 0
              ? sprintf(
                  /* translators: %d: number of records that were kept because other data uses them. */
                  _n(
                    'The migration was reverted. %d record was kept because it is in use.',
                    'The migration was reverted. %d records were kept because they are in use.',
                    revertResult.kept,
                    'kirki-ecommerce',
                  ),
                  revertResult.kept,
                )
              : __('The migration was reverted.', 'kirki-ecommerce')
          }
        />
      )}
      {!isLoading && !errorMessage && groups.length === 0 && (
        <Text color="secondary">{__('There is no data to migrate.', 'kirki-ecommerce')}</Text>
      )}
      {!isLoading && !errorMessage && groups.length > 0 && (
        <Flex direction="column" gap={3}>
          {groups.map((group) => (
            <Checkbox
              key={group.id}
              value={!deselected.includes(group.id)}
              onChange={(isChecked) => onToggle(group.id, isChecked)}
              label={`${group.label} (${group.count})`}
            />
          ))}
        </Flex>
      )}
      {!isLoading && !errorMessage && unsupportedExtensions.length > 0 && (
        <Alert
          type="warning"
          text={sprintf(
            /* translators: %s: names of plugins whose data is not migrated. */
            __('The data of these plugins is not migrated: %s.', 'kirki-ecommerce'),
            unsupportedExtensions.map((extension) => extension.label).join(', '),
          )}
        />
      )}
    </MigrationStepLayout>
  );
};

MigrationScanStep.displayName = 'MigrationScanStep';

export default MigrationScanStep;
