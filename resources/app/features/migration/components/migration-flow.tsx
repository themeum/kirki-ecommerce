import { useEffect, useMemo, useRef, useState } from 'react';

import MigrationRevertStep from '@/features/migration/components/migration-revert-step';
import MigrationRunStep from '@/features/migration/components/migration-run-step';
import MigrationScanStep from '@/features/migration/components/migration-scan-step';
import MigrationSummaryStep from '@/features/migration/components/migration-summary-step';
import { useMigrationRunner } from '@/features/migration/hooks/use-migration-runner';
import { getOverallPercent, getProgressMessage } from '@/features/migration/lib/progress';
import {
  useLatestMigrationRunQuery,
  useMigrationRunQuery,
  useMigrationScanQuery,
} from '@/features/migration/services/migration';
import { getErrorMessage } from '@/services/helpers';
import { __, sprintf } from '@/wpi18n';

type MigrationShellProgress = {
  percent: number;
  title: string;
  message: string;
};

type MigrationFlowProps = {
  source: string;
  sourceLabel: string;
  onProgressChange: (progress: MigrationShellProgress) => void;
  onSkip: () => void;
  onFinish: () => void;
};

const MigrationFlow = ({
  source,
  sourceLabel,
  onProgressChange,
  onSkip,
  onFinish,
}: MigrationFlowProps) => {
  const scan = useMigrationScanQuery(source);
  const latestRun = useLatestMigrationRunQuery(source);
  const runner = useMigrationRunner({ source });
  const [deselected, setDeselected] = useState<string[]>([]);
  const savedRun = useMigrationRunQuery(runner.phase === 'done' ? runner.run?.id : undefined);
  const hasRestored = useRef(false);
  const { restore } = runner;

  const groupIds = useMemo(() => scan.data?.groups.map((group) => group.id) ?? [], [scan.data]);

  useEffect(() => {
    if (hasRestored.current || latestRun.isPending) {
      return;
    }

    hasRestored.current = true;

    if (latestRun.data) {
      restore(latestRun.data);
    }
  }, [latestRun.isPending, latestRun.data, restore]);

  const title = sprintf(
    /* translators: %s: name of the plugin the data comes from. */
    __('Migrate from %s', 'kirki-ecommerce'),
    sourceLabel,
  );

  useEffect(() => {
    if (runner.phase === 'idle') {
      onProgressChange({
        percent: 0,
        title,
        message: __('Choose what to migrate', 'kirki-ecommerce'),
      });

      return;
    }

    if (runner.phase === 'reverting' || runner.phase === 'revert-failed') {
      const total = runner.revertProgress?.total ?? 0;
      const handled = (runner.revertProgress?.removed ?? 0) + (runner.revertProgress?.kept ?? 0);

      onProgressChange({
        percent: total > 0 ? Math.round((handled / total) * 100) : 0,
        title,
        message:
          runner.phase === 'revert-failed'
            ? __('The revert stopped', 'kirki-ecommerce')
            : __('Reverting the migration', 'kirki-ecommerce'),
      });

      return;
    }

    onProgressChange({
      percent: runner.phase === 'done' ? 100 : getOverallPercent(runner.groups),
      title,
      message:
        runner.phase === 'failed'
          ? __('The migration stopped', 'kirki-ecommerce')
          : getProgressMessage(runner.progress),
    });
  }, [runner.phase, runner.groups, runner.progress, runner.revertProgress, title, onProgressChange]);

  const toggleGroup = (groupId: string, isChecked: boolean) => {
    setDeselected((current) =>
      isChecked ? current.filter((id) => id !== groupId) : [...current, groupId],
    );
  };

  if (runner.phase === 'done') {
    return (
      <MigrationSummaryStep
        groups={runner.groups}
        skippedItems={savedRun.data?.skipped_items ?? []}
        notes={runner.notes}
        onGoToDashboard={onFinish}
        onRevert={() => void runner.revert()}
      />
    );
  }

  if (runner.phase === 'reverting' || runner.phase === 'revert-failed') {
    return (
      <MigrationRevertStep
        progress={runner.revertProgress}
        isFailed={runner.phase === 'revert-failed'}
        errorMessage={runner.errorMessage}
        onRetry={() => void runner.revert()}
      />
    );
  }

  if (runner.phase !== 'idle') {
    return (
      <MigrationRunStep
        groups={runner.groups}
        isFailed={runner.phase === 'failed'}
        errorMessage={runner.errorMessage}
        onRetry={() => void runner.resume()}
      />
    );
  }

  return (
    <MigrationScanStep
      sourceLabel={sourceLabel}
      isLoading={scan.isPending}
      errorMessage={scan.isError ? getErrorMessage(scan.error) : undefined}
      groups={scan.data?.groups ?? []}
      extensions={scan.data?.extensions ?? []}
      deselected={deselected}
      revertResult={runner.revertResult}
      onToggle={toggleGroup}
      onRetry={() => void scan.refetch()}
      onSkip={onSkip}
      onMigrate={() => void runner.start(groupIds.filter((id) => !deselected.includes(id)))}
    />
  );
};

MigrationFlow.displayName = 'MigrationFlow';

export default MigrationFlow;
export type { MigrationShellProgress };
