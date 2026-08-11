import { useSyncExternalStore } from 'react';

type Listener = () => void;

let hasUnsavedData = false;
const listeners = new Set<Listener>();

const emitChange = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

export const setUnsavedDataStatus = (status: boolean): void => {
  if (hasUnsavedData === status) {
    return;
  }

  hasUnsavedData = status;
  emitChange();
};

export const getUnsavedDataStatus = (): boolean => {
  return hasUnsavedData;
};

export const checkUnsavedDataStatus = (): boolean => {
  return hasUnsavedData;
};

const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): boolean => {
  return hasUnsavedData;
};

const getServerSnapshot = (): boolean => {
  return false;
};

export const useUnsavedStatus = (): boolean => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
