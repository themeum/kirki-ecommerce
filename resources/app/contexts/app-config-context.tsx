import { createContext, type ReactNode, useContext, useMemo } from 'react';

import type { AppConfig } from '@/schemas/catalog/app-config';
import { useDefaultSettingsQuery } from '@/services/settings';
import { __ } from '@/wpi18n';

type AppConfigContextValue = {
  settings?: AppConfig;
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
    throw new Error(__('useAppConfig must be used within AppConfigProvider', 'kirki-ecommerce'));
  }

  return context;
};

export { AppConfigProvider, useAppConfig };
export type { AppConfigContextValue };

