import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/config/endpoints';
import type { EmailTemplateFormPayload } from '@/features/settings/email/schemas/forms/email-template-form';
import { apiClient } from '@/libs/api';
import { emailTemplatePreviewKeys } from '@/libs/query-keys';
import { parseData, parseMessage, toastMutationError, toastMutationSuccess } from '@/services/helpers';

const EmailTemplatePreviewSchema = z.object({ html: z.string() });

const getEmailTemplatePreview = () => {
  return apiClient
    .get(endpoints.EMAIL_TEMPLATE_PREVIEW)
    .then((response) => parseData(EmailTemplatePreviewSchema, response));
};

const sendTestEmail = (data: EmailTemplateFormPayload) => {
  return apiClient
    .post(endpoints.EMAIL_TEMPLATE_SEND_TEST_MAIL, data)
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
