import { useEffect, useRef, useState } from 'react';

import { useImportSampleDataMutation } from '@/features/home/services/sample-data';

type SampleDataImportPhase = 'idle' | 'downloading' | 'done';

type UseSampleDataImportOptions = {
  onLoaded: () => void;
  loadedPauseMs?: number;
};

const TICK_MS = 100;
const EASE_DURATION_MS = 10000;
const EASED_PROGRESS = 95;
const PROGRESS_LIMIT = 99;
const CREEP_RATE = 0.02;
const DEFAULT_LOADED_PAUSE_MS = 1000;

const toEasedProgress = (elapsed: number) => {
  const remaining = 1 - elapsed / EASE_DURATION_MS;

  return EASED_PROGRESS * (1 - remaining ** 3);
};

const toCreepingProgress = (value: number) => {
  return value + (PROGRESS_LIMIT - value) * CREEP_RATE;
};

export const useSampleDataImport = ({
  onLoaded,
  loadedPauseMs = DEFAULT_LOADED_PAUSE_MS,
}: UseSampleDataImportOptions) => {
  const { mutateAsync: importSampleData } = useImportSampleDataMutation();
  const [phase, setPhase] = useState<SampleDataImportPhase>('idle');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (phase !== 'done') {
      return;
    }

    const timeout = setTimeout(() => onLoadedRef.current(), loadedPauseMs);

    return () => clearTimeout(timeout);
  }, [phase, loadedPauseMs]);

  const runProgress = () => {
    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed += TICK_MS;

      if (elapsed <= EASE_DURATION_MS) {
        setProgress(toEasedProgress(elapsed));
        return;
      }

      setProgress(toCreepingProgress);
    }, TICK_MS);
  };

  const start = async () => {
    if (phase !== 'idle') {
      return;
    }

    setProgress(0);
    setPhase('downloading');
    runProgress();

    const isImported = await importSampleData().then(
      () => true,
      () => false,
    );
    clearInterval(intervalRef.current);

    if (!isImported) {
      setProgress(0);
      setPhase('idle');
      return;
    }

    setProgress(100);
    setPhase('done');
  };

  return {
    phase,
    progress,
    start,
    isImporting: phase === 'downloading',
  };
};
