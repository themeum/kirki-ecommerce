import type { z } from 'zod';

import type { EmailSettingsFormInput } from '@/features/settings/email/schemas/forms/email-settings-form';
import type { EmailNotificationSchema } from '@/schemas/catalog/settings';
import { __ } from '@/wpi18n';

export type EmailListItem = z.infer<typeof EmailNotificationSchema> & { key: string };

/**
 * Loose on purpose: callers pass the zod-inferred notification records
 * (a passthrough object type) which don't structurally match `EmailListItem`
 * despite carrying the same fields at runtime.
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
): EmailListItem[] => {
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

export type NotificationTemplateRef = {
  type: 'customer' | 'admin';
  group: 'order' | 'user' | 'inventory';
  key: string;
};

/**
 * Derives `{ type, group, key }` from a list item's composite `key`
 * (`${prefix}_${id}`, see `mapEmailGroup`) by stripping the `EMAIL_CONFIG`
 * prefix that produced it, and translating that entry's full group name
 * (`order_notifications`, etc.) to the short route segment used by the
 * backend registry and notification dictionary.
 */
export const resolveNotificationTemplate = (
  item: Pick<EmailListItem, 'key'>,
  prefix: string,
): NotificationTemplateRef | undefined => {
  const config = EMAIL_CONFIG[prefix];

  if (!config) {
    return undefined;
  }

  const key = item.key.startsWith(`${prefix}_`) ? item.key.slice(prefix.length + 1) : item.key;
  const type: NotificationTemplateRef['type'] = config.root === 'admin_emails' ? 'admin' : 'customer';
  const group: NotificationTemplateRef['group'] =
    config.group === 'inventory_notifications' ? 'inventory' : config.group === 'user_notifications' ? 'user' : 'order';

  return { type, group, key };
};

type NotificationTemplateDictionaryEntry = NotificationTemplateRef & { label: string };

const ORDER_EVENT_LABELS: Record<string, string> = {
  order_confirmation: __('Order Confirmation', 'kirki-ecommerce'),
};

/**
 * The canonical list of all 17 notification templates the backend
 * (`EmailNotificationRegistry`) knows how to preview/test-send. Used both to
 * label list rows and to build each row's edit route.
 */
export const NOTIFICATION_TEMPLATES: NotificationTemplateDictionaryEntry[] = [
  ...Object.entries(ORDER_EVENT_LABELS).map(([key, label]) => ({
    type: 'customer' as const,
    group: 'order' as const,
    key,
    label,
  })),
  ...Object.entries(ORDER_EVENT_LABELS).map(([key, label]) => ({
    type: 'admin' as const,
    group: 'order' as const,
    key,
    label,
  })),
  {
    type: 'customer',
    group: 'user',
    key: 'reset_password',
    label: __('Password Reset', 'kirki-ecommerce'),
  },
  {
    type: 'admin',
    group: 'user',
    key: 'reset_password',
    label: __('Password Reset', 'kirki-ecommerce'),
  },
  {
    type: 'admin',
    group: 'inventory',
    key: 'low_stock',
    label: __('Low Stock Alert', 'kirki-ecommerce'),
  },
];

export const getNotificationTemplateLabel = (ref: NotificationTemplateRef | undefined): string => {
  if (!ref) {
    return '';
  }

  const match = NOTIFICATION_TEMPLATES.find(
    (entry) => entry.type === ref.type && entry.group === ref.group && entry.key === ref.key,
  );

  return match?.label ?? '';
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
