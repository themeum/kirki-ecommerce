import { useContext } from 'react';

import {
  EditNotificationTemplateContext,
  type EditNotificationTemplateContextValue,
} from '@/features/settings/email/contexts/edit-notification-template-context';
import { __ } from '@/wpi18n';

const useEditNotificationTemplate = (): EditNotificationTemplateContextValue => {
  const context = useContext(EditNotificationTemplateContext);

  if (!context) {
    throw new Error(
      __(
        'useEditNotificationTemplate must be used within EditNotificationTemplateProvider',
        'kirki-ecommerce',
      ),
    );
  }

  return context;
};

export { useEditNotificationTemplate };
