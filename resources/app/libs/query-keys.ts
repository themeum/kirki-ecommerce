import type { ListQueryParams } from '@/types/list-state';

const countryKeys = {
  all: ['Countries'] as const,
  list: (params?: ListQueryParams) => [...countryKeys.all, params] as const,
};

const settingsKeys = {
  all: ['Settings'] as const,
  section: (key: string) => [...settingsKeys.all, key] as const,
};

const defaultSettingsKeys = {
  all: ['DefaultSettings'] as const,
};

const emailTemplatePreviewKeys = {
  all: ['EmailTemplatePreview'] as const,
};

const emailNotificationPreviewKeys = {
  all: ['EmailNotificationPreview'] as const,
  detail: (type: string, group: string, key: string) =>
    [...emailNotificationPreviewKeys.all, type, group, key] as const,
};

export {
  countryKeys,
  defaultSettingsKeys,
  emailNotificationPreviewKeys,
  emailTemplatePreviewKeys,
  settingsKeys,
};
