import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type SettingsSearchTarget = {
  searchId: string;
  route: string;
  terms: string[];
};

type SettingsSearchContextValue = {
  target: SettingsSearchTarget | null;
  setTarget: (target: SettingsSearchTarget) => void;
  clearTarget: () => void;
};

const SettingsSearchContext = createContext<SettingsSearchContextValue>({
  target: null,
  setTarget: () => undefined,
  clearTarget: () => undefined,
});

const SettingsSearchProvider = ({ children }: { children: ReactNode }) => {
  const [target, setActiveTarget] = useState<SettingsSearchTarget | null>(null);

  const setTarget = useCallback((next: SettingsSearchTarget) => {
    setActiveTarget(next);
  }, []);

  const clearTarget = useCallback(() => {
    setActiveTarget(null);
  }, []);

  const value = useMemo(
    () => ({ target, setTarget, clearTarget }),
    [target, setTarget, clearTarget],
  );

  return (
    <SettingsSearchContext.Provider value={value}>{children}</SettingsSearchContext.Provider>
  );
};

SettingsSearchProvider.displayName = 'SettingsSearchProvider';

const useSettingsSearchTarget = () => {
  return useContext(SettingsSearchContext);
};

export { SettingsSearchProvider, useSettingsSearchTarget };
export type { SettingsSearchTarget };
