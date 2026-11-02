import type { SetupRowState } from '@/features/onboarding/hooks/use-staggered-rows';

const SETUP_SHARE_WITH_MIGRATION = 0.1;

type CompletionProgressOptions = {
  stepCount: number;
  rowStates: SetupRowState[];
  hasMigration: boolean;
  migrationPercent: number;
};

export const getStepProgress = (stepsDone: number, stepCount: number) =>
  (stepsDone / (stepCount + 1)) * 100;

export const getCompletionProgress = ({
  stepCount,
  rowStates,
  hasMigration,
  migrationPercent,
}: CompletionProgressOptions) => {
  const completedRows = rowStates.filter((state) => state === 'completed').length;
  const setupDone = rowStates.length === 0 ? 0 : completedRows / rowStates.length;
  const migrationDone = Math.min(Math.max(migrationPercent, 0), 100) / 100;
  const workDone = hasMigration
    ? SETUP_SHARE_WITH_MIGRATION * setupDone + (1 - SETUP_SHARE_WITH_MIGRATION) * migrationDone
    : setupDone;

  return ((stepCount + workDone) / (stepCount + 1)) * 100;
};
