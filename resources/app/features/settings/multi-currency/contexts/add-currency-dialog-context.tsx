import { createContext, type ReactNode, useContext, useMemo } from 'react';

import type { UseAddCurrencyDialogProps } from '@/features/settings/multi-currency/hooks/use-add-currency-dialog';
import { useAddCurrencyDialog } from '@/features/settings/multi-currency/hooks/use-add-currency-dialog';
import { __ } from '@/wpi18n';

const AddCurrencyDialogContext = createContext<UseAddCurrencyDialogProps | null>(null);

type AddCurrencyDialogProviderProps = {
  children: ReactNode;
};

const AddCurrencyDialogProvider = ({ children }: AddCurrencyDialogProviderProps) => {
  const dialog = useAddCurrencyDialog();

  const value = useMemo<UseAddCurrencyDialogProps>(() => dialog, [dialog]);

  return (
    <AddCurrencyDialogContext.Provider value={value}>{children}</AddCurrencyDialogContext.Provider>
  );
};

AddCurrencyDialogProvider.displayName = 'AddCurrencyDialogProvider';

const useAddCurrencyDialogContext = (): UseAddCurrencyDialogProps => {
  const context = useContext(AddCurrencyDialogContext);

  if (!context) {
    throw new Error(
      __(
        'useAddCurrencyDialogContext must be used within AddCurrencyDialogProvider',
        'kirki-ecommerce',
      ),
    );
  }

  return context;
};

export { AddCurrencyDialogProvider, useAddCurrencyDialogContext };
