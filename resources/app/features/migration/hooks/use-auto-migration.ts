import { useEffect, useRef } from 'react';

import { useMigrationRunner } from '@/features/migration/hooks/use-migration-runner';
import { getOverallPercent, getProgressDetail } from '@/features/migration/lib/progress';
import {
  useLatestMigrationRunQuery,
  useMigrationScanQuery,
} from '@/features/migration/services/migration';
import { getErrorMessage } from '@/services/helpers';

type MigrationStatus = 'waiting' | 'running' | 'done' | 'failed';

type UseAutoMigrationOptions = {
  source: string;
  isEnabled: boolean;
};

const useAutoMigration = ({ source, isEnabled }: UseAutoMigrationOptions) => {
  const scan = useMigrationScanQuery(source, { enabled: isEnabled });
  const latestRun = useLatestMigrationRunQuery(source, { enabled: isEnabled });
  const runner = useMigrationRunner({ source });
  const hasStarted = useRef(false);
  const { start, resume, restore } = runner;
  const groupIds = scan.data?.groups.map((group) => group.id);
  const isReady = isEnabled && !latestRun.isPending && groupIds !== undefined;

  useEffect(() => {
    if (!isReady || hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    if (latestRun.data) {
      restore(latestRun.data);

      return;
    }

    void start(groupIds);
  }, [isReady, latestRun.data, groupIds, restore, start]);

  const getStatus = (): MigrationStatus => {
    if (runner.phase === 'done') {
      return 'done';
    }

    if (runner.phase === 'failed' || scan.isError) {
      return 'failed';
    }

    return runner.phase === 'idle' ? 'waiting' : 'running';
  };

  const retry = () => {
    if (scan.isError) {
      void scan.refetch();

      return;
    }

    if (runner.run) {
      void resume();

      return;
    }

    if (groupIds) {
      void start(groupIds);
    }
  };

  return {
    status: getStatus(),
    percent: runner.phase === 'done' ? 100 : getOverallPercent(runner.groups),
    detail: getProgressDetail(runner.progress),
    errorMessage: scan.isError ? getErrorMessage(scan.error) : (runner.errorMessage ?? undefined),
    retry,
  };
};

export { type MigrationStatus, useAutoMigration };
