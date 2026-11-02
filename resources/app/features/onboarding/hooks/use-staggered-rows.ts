import { useEffect, useState } from 'react';

type SetupStatus = 'pending' | 'success' | 'error';

type SetupRowState = 'waiting' | 'in-progress' | 'completed' | 'stopped';

type UseStaggeredRowsOptions = {
  rowCount: number;
  setupStatus: SetupStatus;
  runId: number;
};

const ROW_STAGGER_MS = 400;

export const useStaggeredRows = ({ rowCount, setupStatus, runId }: UseStaggeredRowsOptions) => {
  const [progress, setProgress] = useState({ runId, tick: 0 });
  const tick = progress.runId === runId ? progress.tick : 0;

  useEffect(() => {
    if (setupStatus === 'error' || tick >= rowCount) {
      return;
    }

    const timeout = setTimeout(() => setProgress({ runId, tick: tick + 1 }), ROW_STAGGER_MS);

    return () => clearTimeout(timeout);
  }, [rowCount, runId, setupStatus, tick]);

  const completedCount =
    setupStatus === 'success' ? Math.min(tick, rowCount) : Math.min(tick, rowCount - 1);

  return Array.from({ length: rowCount }, (_, index): SetupRowState => {
    if (index < completedCount) {
      return 'completed';
    }

    if (setupStatus === 'error') {
      return 'stopped';
    }

    return index === completedCount ? 'in-progress' : 'waiting';
  });
};

export type { SetupRowState, SetupStatus };
