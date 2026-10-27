import { useSyncExternalStore } from 'react';

type OnboardingStatus = {
  isOnboarded: boolean;
  isSetupSessionActive: boolean;
};

type Listener = () => void;

let status: OnboardingStatus = {
  isOnboarded: Boolean(window.kirki_ecommerce?.is_onboarded),
  isSetupSessionActive: false,
};

const listeners = new Set<Listener>();

const setStatus = (changes: Partial<OnboardingStatus>) => {
  status = { ...status, ...changes };
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getOnboardingStatus = () => status;

const markOnboarded = () => setStatus({ isOnboarded: true });

const beginSetupSession = () => setStatus({ isSetupSessionActive: true });

const endSetupSession = () => setStatus({ isSetupSessionActive: false });

const useOnboardingStatus = () => useSyncExternalStore(subscribe, getOnboardingStatus);

export { beginSetupSession, endSetupSession, markOnboarded, useOnboardingStatus };
