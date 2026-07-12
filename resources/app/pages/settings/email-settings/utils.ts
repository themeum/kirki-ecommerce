import type { SettingsSectionData } from '@/types';

type EmailNotification = {
  name?: string;
  is_enabled?: boolean;
  [key: string]: unknown;
};

type EmailGroup = Record<string, EmailNotification>;

type EmailConfigEntry = {
  root: string;
  group: string;
};

type BuildTogglePayloadParams = {
  baseData: SettingsSectionData;
  rootKey: string;
  groupKey: string;
  selectedKey: string;
};

export const mapEmailGroup = (
  group: EmailGroup | null | undefined,
  prefix: string,
): Array<EmailNotification & { key: string }> => {
  if (!group) {
    return [];
  }

  return Object.entries(group).map(([id, email]) => ({
    key: `${prefix}_${id}`,
    ...email,
  }));
};

export const EMAIL_CONFIG: Record<string, EmailConfigEntry> = {
  customer_order: {
    root: 'customer_emails',
    group: 'order_notifications',
  },
  customer_user: {
    root: 'customer_emails',
    group: 'user_notifications',
  },
  admin_order: {
    root: 'admin_emails',
    group: 'order_notifications',
  },
  admin_user: {
    root: 'admin_emails',
    group: 'user_notifications',
  },
  admin_inventory: {
    root: 'admin_emails',
    group: 'inventory_notifications',
  },
};

export const findEmailKeyByName = (
  data: EmailGroup = {},
  name: string,
): string | undefined => {
  return Object.keys(data).find((key) => data[key]?.name === name);
};

export const buildTogglePayload = ({
  baseData,
  rootKey,
  groupKey,
  selectedKey,
}: BuildTogglePayloadParams): SettingsSectionData | null => {
  console.log({ selectedKey });
  const rootData = (
    baseData as Record<string, Record<string, EmailGroup> | undefined>
  )?.[rootKey];
  const current = rootData?.[groupKey]?.[selectedKey];

  if (!current) {
    return null;
  }

  return {
    ...baseData,
    [rootKey]: {
      ...rootData,
      [groupKey]: {
        ...rootData?.[groupKey],
        [selectedKey]: {
          ...current,
          is_enabled: !current.is_enabled,
        },
      },
    },
  };
};
