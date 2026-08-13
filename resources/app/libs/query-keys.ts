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

export { countryKeys, defaultSettingsKeys, settingsKeys };
