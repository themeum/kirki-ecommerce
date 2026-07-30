import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useDefaultSettingsQuery } from '@/services/settings';
import type { SettingsSectionData } from '@/types';

type AppConfigContextValue = {
  settings?: SettingsSectionData;
  isLoading: boolean;
};

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

type AppConfigProviderProps = {
  children: ReactNode;
};

const AppConfigProvider = ({ children }: AppConfigProviderProps) => {
  const { data, isLoading } = useDefaultSettingsQuery();

  const value = useMemo<AppConfigContextValue>(
    () => ({ settings: data, isLoading }),
    [data, isLoading],
  );

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
};

AppConfigProvider.displayName = 'AppConfigProvider';

const useAppConfig = (): AppConfigContextValue => {
  const context = useContext(AppConfigContext);

  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }

  return context;
};

export { AppConfigProvider, useAppConfig };
export type { AppConfigContextValue };

