import type { EmailSettingsFormPayload } from '@/features/settings/email/schemas/forms/email-settings-form';
import type { EmailTemplateFormPayload } from '@/features/settings/email/schemas/forms/email-template-form';

const POSITION_MAP: Record<string, number> = {
  start: 0,
  center: 1,
  end: 2,
};

const INDEX_TO_POSITION = ['start', 'center', 'end'];

export const resolveLogoUrl = (logo: unknown): string => {
  if (!logo) {
    return '';
  }
  if (typeof logo === 'string') {
    return logo;
  }
  if (typeof logo === 'object' && 'url' in logo) {
    return String((logo as { url?: string }).url ?? '');
  }
  return '';
};

export const positionToTabIndex = (position: string | null | undefined): string =>
  String(POSITION_MAP[position || ''] ?? 0);

export const tabIndexToPosition = (index: string | number): string =>
  INDEX_TO_POSITION[Number(index)] || 'start';

export const resolveTemplateFormOverrides = (
  defaultEmail: Record<string, unknown>,
): { logo: string; height: number } => ({
  logo: resolveLogoUrl(defaultEmail.logo),
  height: parseInt(String(defaultEmail.height), 10) || 50,
});

/**
 * The `default_template` write merges the edited fields over whatever the
 * server already has, so untouched template fields (ones this form doesn't
 * expose) survive the save.
 */
export const buildEmailTemplatePayload = (
  emailSettingsData: { default_template?: unknown },
  currentEmailSettings: Pick<EmailSettingsFormPayload, 'admin_emails' | 'customer_emails'>,
  payload: EmailTemplateFormPayload,
): Pick<EmailSettingsFormPayload, 'admin_emails' | 'customer_emails'> & { default_template: Record<string, unknown> } => ({
  admin_emails: currentEmailSettings.admin_emails,
  customer_emails: currentEmailSettings.customer_emails,
  default_template: {
    ...((emailSettingsData.default_template as Record<string, unknown>) ?? {}),
    ...payload,
  },
});
