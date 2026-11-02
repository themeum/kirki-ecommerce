import type {
  MigrationGroupState,
  MigrationProgress,
} from '@/features/migration/schemas/catalog/migration';
import { __, sprintf } from '@/wpi18n';

const getOverallPercent = (groups: Record<string, MigrationGroupState>): number => {
  const states = Object.values(groups);
  const total = states.reduce((sum, state) => sum + state.total, 0);

  if (total === 0) {
    return states.length > 0 && states.every((state) => state.status === 'done') ? 100 : 0;
  }

  const done = states.reduce((sum, state) => sum + Math.min(state.done, state.total), 0);

  return Math.round((done / total) * 100);
};

const getProgressDetail = (progress: MigrationProgress | null): string => {
  if (!progress) {
    return __('Preparing…', 'kirki-ecommerce');
  }

  if (progress.done || !progress.group || !progress.label) {
    return __('Finishing up…', 'kirki-ecommerce');
  }

  const total = progress.groups[progress.group]?.total ?? progress.range_to;

  return sprintf(
    /* translators: 1: data group, for example Products. 2: first item number. 3: last item number. 4: total. */
    __('%1$s %2$d-%3$d of %4$d', 'kirki-ecommerce'),
    progress.label,
    progress.range_from,
    progress.range_to,
    total,
  );
};

const getProgressMessage = (progress: MigrationProgress | null): string => {
  if (!progress) {
    return __('Preparing the migration…', 'kirki-ecommerce');
  }

  if (progress.done || !progress.group || !progress.label) {
    return __('Migration complete', 'kirki-ecommerce');
  }

  const total = progress.groups[progress.group]?.total ?? progress.range_to;

  return sprintf(
    /* translators: 1: data group, for example Products. 2: first item number. 3: last item number. 4: total. */
    __('Migrating %1$s %2$d-%3$d of %4$d', 'kirki-ecommerce'),
    progress.label,
    progress.range_from,
    progress.range_to,
    total,
  );
};

export { getOverallPercent, getProgressDetail, getProgressMessage };
