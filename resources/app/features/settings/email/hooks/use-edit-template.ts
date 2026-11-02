import { useContext } from 'react';

import {
  EditTemplateContext,
  type EditTemplateContextValue,
} from '@/features/settings/email/contexts/edit-template-context';
import { __ } from '@/wpi18n';

const useEditTemplate = (): EditTemplateContextValue => {
  const context = useContext(EditTemplateContext);

  if (!context) {
    throw new Error(
      __('useEditTemplate must be used within EditTemplateProvider', 'kirki-ecommerce'),
    );
  }

  return context;
};

export { useEditTemplate };
