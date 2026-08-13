import type { EmailSettingsFormInput } from '@/features/settings/email/schemas/forms/email-settings-form';

type EmailNotification = {
  name?: string;
  is_enabled?: boolean;
  [key: string]: unknown;
};

/**
 * Loose on purpose: callers pass the zod-inferred notification records
 * (a passthrough object type) which don't structurally match a hand-written
 * `EmailNotification` despite carrying the same fields at runtime.
 */
type EmailGroup = Record<string, Record<string, unknown> | null | undefined>;

type EmailConfigEntry = {
  root: string;
  group: string;
};

type BuildTogglePayloadParams = {
  baseData: EmailSettingsFormInput;
  rootKey: string;
  groupKey: string;
  selectedKey: string;
};

export const mapEmailGroup = (
  group: EmailGroup | null | undefined,
  prefix: string,
): (EmailNotification & { key: string })[] => {
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
}: BuildTogglePayloadParams): EmailSettingsFormInput | null => {
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
