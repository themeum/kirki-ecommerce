import { toast } from 'sonner';

import { sprintf } from '@/wpi18n';

export const uuid = () => {
  // Generates a UUID v4 string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function createAcronym(user: { first_name?: string; last_name?: string }) {
  const firstName = (user.first_name ?? '').trim();
  const lastName = (user.last_name ?? '').trim();

  if (firstName && lastName) {
    return sprintf('%s%s', firstName.charAt(0), lastName.charAt(0)).toUpperCase();
  }

  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }

  return '';
}
export async function copyToClipboard(content: string) {
  if (typeof navigator.clipboard !== 'undefined' && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error copying into clipboard');
      return false;
    }
    return true;
  }

  const element = document.createElement('textarea');
  element.innerText = content;
  element.style.position = 'fixed';
  element.style.left = '-99999px';
  document.body.appendChild(element);

  element.focus();
  element.select();

  try {
    // Legacy fallback for insecure contexts / browsers without the Clipboard API; deprecated but intentional.
    document.execCommand('copy');
    toast.success('Copied to clipboard');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error coping into clipboard');
    return false;
  } finally {
    document.body.removeChild(element);
  }

  return true;
}
