import {
  type Consent,
  CONSENT_LOCATIONS,
  type ConsentLocation,
} from '@/features/settings/legal/schemas/catalog/legal';
import { __ } from '@/wpi18n';

export const consentLocationLabels = (): Record<ConsentLocation, string> => ({
  signup: __('Sign Up Page', 'kirki-ecommerce'),
  login: __('Login Page', 'kirki-ecommerce'),
  checkout: __('Checkout', 'kirki-ecommerce'),
});

export const consentMethodOptions = () => [
  { value: 'mandatory_checkbox', label: __('Mandatory Checkbox', 'kirki-ecommerce') },
  { value: 'optional_checkbox', label: __('Optional Checkbox', 'kirki-ecommerce') },
  { value: 'display_text_only', label: __('Display Text Only', 'kirki-ecommerce') },
];

export const sortLocations = (locations: ConsentLocation[]): ConsentLocation[] => {
  return CONSENT_LOCATIONS.filter((location) => locations.includes(location));
};

export const upsertConsent = (consents: Consent[], consent: Consent): Consent[] => {
  const exists = consents.some((item) => item.id === consent.id);

  if (!exists) {
    return [...consents, consent];
  }

  return consents.map((item) => (item.id === consent.id ? consent : item));
};

export const toggleConsent = (consents: Consent[], id: string): Consent[] => {
  return consents.map((item) =>
    item.id === id ? { ...item, is_enabled: !(item.is_enabled ?? true) } : item,
  );
};

export const removeConsent = (consents: Consent[], id: string): Consent[] => {
  return consents.filter((item) => item.id !== id);
};

export const hasEnabledSignupConsent = (consents: Consent[]): boolean => {
  return consents.some(
    (consent) => (consent.is_enabled ?? true) && (consent.locations ?? []).includes('signup'),
  );
};
