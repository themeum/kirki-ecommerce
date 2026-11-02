import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import MigrationStepLayout from '@/features/migration/components/migration-step-layout';
import type {
  MigrationGroupState,
  MigrationSkippedItem,
} from '@/features/migration/schemas/catalog/migration';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

type MigrationSummaryStepProps = {
  groups: Record<string, MigrationGroupState>;
  skippedItems: MigrationSkippedItem[];
  notes: string[];
  onGoToDashboard: () => void;
  onRevert: () => void;
};

const MigrationSummaryStep = ({
  groups,
  skippedItems,
  notes,
  onGoToDashboard,
  onRevert,
}: MigrationSummaryStepProps) => {
  const [isConfirmingRevert, setIsConfirmingRevert] = useState(false);
  const stats = Object.entries(groups)
    .map(([id, state]) => ({ id, label: state.label, count: state.created + state.reused }))
    .filter((stat) => stat.count > 0);
  const attentionCount = skippedItems.length + notes.length;

  return (
    <MigrationStepLayout
      footer={
        isConfirmingRevert ? (
          <>
            <Text color="secondary" cssOverride={styles.confirmText}>
              {__(
                'The records this migration created in Kirki eCommerce will be deleted, and the settings it changed will be restored. Your old store is not changed. This cannot be undone.',
                'kirki-ecommerce',
              )}
            </Text>
            <Button variant="destructive" size="lg" onClick={onRevert}>
              {__('Revert', 'kirki-ecommerce')}
            </Button>
            <Button variant="outline" size="lg" onClick={() => setIsConfirmingRevert(false)}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" onClick={onGoToDashboard}>
              {__('Go to dashboard', 'kirki-ecommerce')}
            </Button>
            <Button variant="outline" size="lg" onClick={() => setIsConfirmingRevert(true)}>
              {__('Revert', 'kirki-ecommerce')}
            </Button>
          </>
        )
      }
    >
      <Flex direction="column" gap={1}>
        <Text variant="heading4" weight="semibold">
          {__('Migration complete', 'kirki-ecommerce')}
        </Text>
        <Text color="secondary">{__('Your old store was not changed.', 'kirki-ecommerce')}</Text>
      </Flex>
      {stats.length > 0 && (
        <Flex direction="column" role="list" aria-label={__('Migrated items', 'kirki-ecommerce')}>
          {stats.map((stat) => (
            <Flex key={stat.id} align="center" gap={3} cssOverride={styles.row} role="listitem">
              <span css={scoped(styles.check)} aria-hidden="true">
                <Check size={12} strokeWidth={3} />
              </span>
              <Text weight="medium" cssOverride={styles.label}>
                {stat.label}
              </Text>
              <Text color="secondary">{stat.count}</Text>
            </Flex>
          ))}
        </Flex>
      )}
      {attentionCount > 0 && (
        <details css={scoped(styles.details)}>
          <summary css={scoped(styles.summary)}>
            <Text color="secondary" weight="medium">
              {sprintf(
                /* translators: %d: number of skipped items and notes to review. */
                _n('%d thing to review', '%d things to review', attentionCount, 'kirki-ecommerce'),
                attentionCount,
              )}
            </Text>
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <Flex direction="column" gap={1} cssOverride={styles.list}>
            {skippedItems.map((item) => (
              <Text key={`${item.group}-${item.source_id}`} variant="small" color="secondary">
                {`${item.group} #${item.source_id}: ${item.reason}`}
              </Text>
            ))}
            {notes.map((note) => (
              <Text key={note} variant="small" color="secondary">
                {note}
              </Text>
            ))}
          </Flex>
        </details>
      )}
    </MigrationStepLayout>
  );
};

MigrationSummaryStep.displayName = 'MigrationSummaryStep';

export default MigrationSummaryStep;

const styles = defineStyles({
  row: {
    padding: `${theme.spacing[1]} 0`,
  },
  check: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '20px',
    height: '20px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.fillSuccessSecondary,
    color: theme.colors.icon.success,
  },
  label: {
    flex: 1,
  },
  details: {
    borderTop: `1px solid ${theme.colors.border.secondary}`,
    paddingTop: theme.spacing[3],
    '&[open] summary svg': {
      transform: 'rotate(180deg)',
    },
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    listStyle: 'none',
    color: theme.colors.icon.secondary,
    '&::-webkit-details-marker': {
      display: 'none',
    },
    '& svg': {
      transition: 'transform 150ms ease',
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
      },
    },
  },
  confirmText: {
    textAlign: 'center',
  },
  list: {
    paddingTop: theme.spacing[3],
    maxHeight: '160px',
    overflowY: 'auto',
  },
});
