import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  MigrationGroupState,
  MigrationProgress,
  MigrationRun,
} from '@/features/migration/schemas/catalog/migration';
import {
  useRunMigrationChunkMutation,
  useStartMigrationMutation,
} from '@/features/migration/services/migration';
import { getErrorMessage } from '@/services/helpers';

type MigrationRunnerPhase = 'idle' | 'starting' | 'running' | 'failed' | 'done';

const NO_GROUPS: Record<string, MigrationGroupState> = {};

type UseMigrationRunnerOptions = {
  source: string;
};

const useMigrationRunner = ({ source }: UseMigrationRunnerOptions) => {
  const queryClient = useQueryClient();
  const startMigration = useStartMigrationMutation();
  const runChunk = useRunMigrationChunkMutation();
  const [phase, setPhase] = useState<MigrationRunnerPhase>('idle');
  const [run, setRun] = useState<MigrationRun | null>(null);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLooping = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const runChunks = useCallback(
    async (runId: number) => {
      if (isLooping.current) {
        return;
      }

      isLooping.current = true;
      setPhase('running');
      setErrorMessage(null);

      try {
        while (isMounted.current) {
          const next = await runChunk.mutateAsync(runId);
          setProgress(next);

          if (next.notes.length > 0) {
            setNotes((current) => [...current, ...next.notes]);
          }

          if (next.done) {
            setPhase('done');
            void queryClient.invalidateQueries();

            return;
          }
        }
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
        setPhase('failed');
      } finally {
        isLooping.current = false;
      }
    },
    [queryClient, runChunk],
  );

  const start = useCallback(
    async (groups: string[]) => {
      setPhase('starting');
      setErrorMessage(null);

      try {
        const created = await startMigration.mutateAsync({ source, groups });
        setRun(created);
        await runChunks(created.id);
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
        setPhase('failed');
      }
    },
    [source, startMigration, runChunks],
  );

  const resume = useCallback(
    async (unfinished?: MigrationRun) => {
      const target = unfinished ?? run;

      if (!target) {
        return;
      }

      setRun(target);
      await runChunks(target.id);
    },
    [run, runChunks],
  );

  const restore = useCallback((saved: MigrationRun) => {
    setRun(saved);
    setErrorMessage(saved.last_error);

    if (saved.status === 'done') {
      setPhase('done');

      return;
    }

    setPhase('failed');
  }, []);

  const groups: Record<string, MigrationGroupState> = progress?.groups ?? run?.groups ?? NO_GROUPS;

  return {
    phase,
    run,
    progress,
    groups,
    notes,
    errorMessage,
    start,
    resume,
    restore,
  };
};

export { type MigrationRunnerPhase, useMigrationRunner };
