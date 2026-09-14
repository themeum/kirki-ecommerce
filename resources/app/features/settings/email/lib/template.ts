import type { EmailSettingsFormPayload } from '@/features/settings/email/schemas/forms/email-settings-form';
import type { EmailTemplateFormPayload } from '@/features/settings/email/schemas/forms/email-template-form';
import type { MediaRef } from '@/schemas/shared/media';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

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

const isMediaRef = (logo: unknown): logo is MediaRef =>
  typeof logo === 'object' && logo !== null && typeof (logo as { url?: unknown }).url === 'string';

/**
 * The saved `default_template.logo` value is a bare attachment id, not a
 * hydrated media object, so there is no url to resolve it into yet — the
 * override is only included when a full media ref is already available.
 */
export const resolveTemplateFormOverrides = (
  defaultEmail: Record<string, unknown>,
): { logo?: MediaRef; height: number } => ({
  ...(isMediaRef(defaultEmail.logo) ? { logo: defaultEmail.logo } : {}),
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
): Pick<EmailSettingsFormPayload, 'admin_emails' | 'customer_emails'> & {
  default_template: Record<string, unknown>;
} => ({
  admin_emails: currentEmailSettings.admin_emails,
  customer_emails: currentEmailSettings.customer_emails,
  default_template: {
    ...((emailSettingsData.default_template as Record<string, unknown>) ?? {}),
    ...payload,
  },
});

export const emailTemplateStyles = defineStyles({
  container: {
    width: '100%',
    padding: `${theme.spacing[4]} ${theme.spacing[2]}`,
  },
  roundedCard: {
    borderRadius: theme.radius.lg,
  },
  squareCard: {
    borderRadius: theme.radius.none,
  },
  sendTextMail: {
    ...theme.typography.small(),
  },
});
