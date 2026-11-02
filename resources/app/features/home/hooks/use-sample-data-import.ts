import { useEffect, useRef, useState } from 'react';

import { useImportSampleDataMutation } from '@/features/home/services/sample-data';

type SampleDataImportPhase = 'idle' | 'downloading' | 'creating' | 'done';

type UseSampleDataImportOptions = {
  onLoaded: () => void;
};

const TICK_MS = 100;
const DOWNLOAD_DURATION_MS = 2500;
const DOWNLOAD_PROGRESS = 70;
const CREATING_PROGRESS_LIMIT = 95;
const CREATING_PROGRESS_RATE = 0.05;
const LOADED_PAUSE_MS = 1000;

export const useSampleDataImport = ({ onLoaded }: UseSampleDataImportOptions) => {
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

    const timeout = setTimeout(() => onLoadedRef.current(), LOADED_PAUSE_MS);

    return () => clearTimeout(timeout);
  }, [phase]);

  const runDownload = () => {
    return new Promise<void>((resolve) => {
      let elapsed = 0;

      intervalRef.current = setInterval(() => {
        elapsed += TICK_MS;
        setProgress(
          Math.min(DOWNLOAD_PROGRESS, (elapsed / DOWNLOAD_DURATION_MS) * DOWNLOAD_PROGRESS),
        );

        if (elapsed >= DOWNLOAD_DURATION_MS) {
          clearInterval(intervalRef.current);
          resolve();
        }
      }, TICK_MS);
    });
  };

  const runCreatingProgress = () => {
    intervalRef.current = setInterval(() => {
      setProgress((value) => value + (CREATING_PROGRESS_LIMIT - value) * CREATING_PROGRESS_RATE);
    }, TICK_MS);
  };

  const start = async () => {
    if (phase !== 'idle') {
      return;
    }

    setProgress(0);
    setPhase('downloading');
    await runDownload();

    setPhase('creating');
    runCreatingProgress();
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
    isImporting: phase === 'downloading' || phase === 'creating',
  };
};
