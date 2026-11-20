type ToastPauseStore = {
  setPaused: (paused: boolean) => void;
  isPaused: () => boolean;
  subscribe: (listener: () => void) => () => void;
};

const createToastPauseStore = (): ToastPauseStore => {
  const listeners = new Set<() => void>();
  let paused = false;

  const setPaused = (next: boolean) => {
    if (paused === next) {
      return;
    }

    paused = next;
    listeners.forEach((listener) => listener());
  };

  const isPaused = () => paused;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  return { setPaused, isPaused, subscribe };
};

const toastPauseStore = createToastPauseStore();

export { createToastPauseStore, toastPauseStore };
export type { ToastPauseStore };
