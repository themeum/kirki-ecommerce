import type { Consent } from '@/features/settings/legal/schemas/catalog/legal';

/**
 * The Legal page persists the whole consent list on every action rather than
 * through a page-level form, so this section has a payload type but no form
 * schema. It exists to key `SettingsPayloadMap` in `services/settings.ts`.
 */
export type LegalSettingsFormPayload = {
  consents: Consent[];
};
