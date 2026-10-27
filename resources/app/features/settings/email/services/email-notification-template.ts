import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/config/endpoints';
import type { EmailNotificationTemplateFormPayload } from '@/features/settings/email/schemas/forms/email-notification-template-form';
import { apiClient } from '@/libs/api';
import { emailNotificationPreviewKeys, settingsKeys } from '@/libs/query-keys';
import {
  parseData,
  parseMessage,
  toastMutationError,
  toastMutationSuccess,
} from '@/services/helpers';

const EmailNotificationPreviewSchema = z.object({
  html: z.string(),
  variables: z.record(z.unknown()),
});

type SendNotificationTestEmailParams = {
  type: string;
  group: string;
  key: string;
  data: EmailNotificationTemplateFormPayload;
};

type RestoreNotificationTemplateParams = {
  type: string;
  group: string;
  key: string;
};

const getEmailNotificationPreview = (type: string, group: string, key: string) => {
  return apiClient
    .get(endpoints.EMAIL_NOTIFICATION_PREVIEW(type, group, key))
    .then((response) => parseData(EmailNotificationPreviewSchema, response));
};

const sendNotificationTestEmail = ({ type, group, key, data }: SendNotificationTestEmailParams) => {
  return apiClient
    .post(endpoints.EMAIL_NOTIFICATION_SEND_TEST_MAIL(type, group, key), data)
    .then((response) => parseMessage(response));
};

const restoreNotificationTemplate = ({ type, group, key }: RestoreNotificationTemplateParams) => {
  return apiClient
    .post(endpoints.EMAIL_NOTIFICATION_RESTORE(type, group, key))
    .then((response) => parseMessage(response));
};

const useEmailNotificationPreviewQuery = (type: string, group: string, key: string) => {
  return useQuery({
    queryKey: emailNotificationPreviewKeys.detail(type, group, key),
    queryFn: () => getEmailNotificationPreview(type, group, key),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

const useSendNotificationTestEmailMutation = () => {
  return useMutation({
    mutationFn: sendNotificationTestEmail,
    onSuccess(response) {
      toastMutationSuccess(response.message);
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useRestoreNotificationTemplateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreNotificationTemplate,
    onSuccess(response, { type, group, key }) {
      toastMutationSuccess(response.message);
      void queryClient.invalidateQueries({ queryKey: settingsKeys.section('email') });
      void queryClient.invalidateQueries({
        queryKey: emailNotificationPreviewKeys.detail(type, group, key),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  useEmailNotificationPreviewQuery,
  useRestoreNotificationTemplateMutation,
  useSendNotificationTestEmailMutation,
};
