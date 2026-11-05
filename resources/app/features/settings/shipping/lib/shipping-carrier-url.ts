import { __ } from '@/wpi18n';

export const TRACKING_PLACEHOLDER = '{tracking_number}';

const URL_SCHEME_PATTERN = /^https?:\/\//i;

export const hasAllowedUrlScheme = (url: string): boolean => URL_SCHEME_PATTERN.test(url.trim());

export const hasTrackingPlaceholder = (url: string): boolean => url.includes(TRACKING_PLACEHOLDER);

export const isTrackingTemplate = (url: string): boolean =>
  hasAllowedUrlScheme(url) && hasTrackingPlaceholder(url);

export const getTrackingTemplateError = (url: string): string | null => {
  if (!hasAllowedUrlScheme(url)) {
    return __('The URL must start with http:// or https://.', 'kirki-ecommerce');
  }

  if (!hasTrackingPlaceholder(url)) {
    return __('The URL must contain the {tracking_number} placeholder.', 'kirki-ecommerce');
  }

  return null;
};

const encodeLikePhp = (value: string): string =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

export const resolveTrackingUrl = (template: string, trackingNumber: string): string =>
  template.split(TRACKING_PLACEHOLDER).join(encodeLikePhp(trackingNumber));

export const toTrackingTemplate = (url: string, trackingNumber: string): string => {
  const encodedNumber = encodeLikePhp(trackingNumber);

  if (!trackingNumber || !url.includes(encodedNumber)) {
    return url;
  }

  return url.split(encodedNumber).join(TRACKING_PLACEHOLDER);
};
