import { useContext } from 'react';

import type { UseAddCurrencyDialogProps } from '@/features/settings/multi-currency/contexts/add-currency-dialog-context';
import { AddCurrencyDialogContext } from '@/features/settings/multi-currency/contexts/add-currency-dialog-context';
import { __ } from '@/wpi18n';

const useAddCurrencyDialog = (): UseAddCurrencyDialogProps => {
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

export default useAddCurrencyDialog;
