import { z } from 'zod';

export const CONSENT_LOCATIONS = ['signup', 'login', 'checkout'] as const;

export const CONSENT_METHODS = [
  'mandatory_checkbox',
  'optional_checkbox',
  'display_text_only',
] as const;

export const ConsentSchema = z
  .object({
    id: z.string(),
    title: z.string().nullish(),
    locations: z.array(z.enum(CONSENT_LOCATIONS)).default([]),
    message: z.string().nullish(),
    method: z.enum(CONSENT_METHODS).catch('mandatory_checkbox'),
    is_enabled: z.boolean().nullish(),
  })
  .passthrough();

/**
 * The backend re-indexes consents so they serialise as an array, but an
 * older stored option row can still surface as an object — coerce rather
 * than reject, since a settings page that throws is worse than one that
 * renders an empty list.
 *
 * `consents` stays `.nullish()` rather than defaulting: every schema in
 * `SettingsSchemaMap` is indexed by a generic key in `getSettings`, and a
 * required output property breaks that union's inference.
 */
export const LegalSettingsSchema = z
  .object({
    consents: z
      .preprocess((value): unknown[] => {
        if (Array.isArray(value)) {
          return value as unknown[];
        }

        if (value && typeof value === 'object') {
          return Object.values(value as Record<string, unknown>);
        }

        return [];
      }, z.array(ConsentSchema))
      .nullish(),
    is_registration_enabled: z.boolean().nullish(),
  })
  .passthrough();

export type Consent = z.infer<typeof ConsentSchema>;
export type ConsentLocation = (typeof CONSENT_LOCATIONS)[number];
export type ConsentMethod = (typeof CONSENT_METHODS)[number];
export type LegalSettings = z.infer<typeof LegalSettingsSchema>;
