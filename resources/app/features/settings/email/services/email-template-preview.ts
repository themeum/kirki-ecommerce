import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/config/endpoints';
import type { EmailTemplateFormPayload } from '@/features/settings/email/schemas/forms/email-template-form';
import { apiClient } from '@/libs/api';
import { emailTemplatePreviewKeys } from '@/libs/query-keys';
import {
  parseData,
  parseMessage,
  toastMutationError,
  toastMutationSuccess,
} from '@/services/helpers';

const EmailTemplatePreviewSchema = z.object({ html: z.string() });

/**
 * The default-template (branding) editor previews/tests against a fixed
 * notification — `customer/order/new_order` — since branding is
 * shared across all notifications and this one always exists.
 */
const DEFAULT_TEMPLATE_PREVIEW_TARGET = ['customer', 'order', 'new_order'] as const;

const getEmailTemplatePreview = () => {
  return apiClient
    .get(endpoints.EMAIL_NOTIFICATION_PREVIEW(...DEFAULT_TEMPLATE_PREVIEW_TARGET))
    .then((response) => parseData(EmailTemplatePreviewSchema, response));
};

const sendTestEmail = (data: EmailTemplateFormPayload) => {
  return apiClient
    .post(endpoints.EMAIL_NOTIFICATION_SEND_TEST_MAIL(...DEFAULT_TEMPLATE_PREVIEW_TARGET), data)
    .then((response) => parseMessage(response));
};

const useEmailTemplatePreviewQuery = () => {
  return useQuery({
    queryKey: emailTemplatePreviewKeys.all,
    queryFn: getEmailTemplatePreview,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

const useSendTestEmailMutation = () => {
  return useMutation({
    mutationFn: sendTestEmail,
    onSuccess(response) {
      toastMutationSuccess(response.message);
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export { useEmailTemplatePreviewQuery, useSendTestEmailMutation };
