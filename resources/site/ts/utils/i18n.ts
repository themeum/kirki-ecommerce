/**
 * WordPress i18n utilities
 */

/**
 * Helper function for WordPress i18n
 * @param text - The text to translate
 * @param domain - The text domain (default: 'kirki-ecommerce')
 * @returns The translated text or the original text if translation is not available
 */
export const translate = (text: string, domain: string = 'kirki-ecommerce'): string => {
  return (window as any).wp?.i18n?.__(text, domain) || text;
};
