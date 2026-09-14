import type { RefObject } from 'react';
import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { resolveLogoUrl } from '@/features/settings/email/lib/template';
import type {
  EmailTemplateFormInput,
  EmailTemplateFormPayload,
} from '@/features/settings/email/schemas/forms/email-template-form';

const POSITION_TO_ALIGN: Record<string, string> = {
  start: 'left',
  center: 'center',
  end: 'right',
};

/**
 * Every element the preview needs to patch live carries a
 * `data-email-part="<field path>"` attribute, mirrored 1:1 to
 * EmailTemplateFormSchema's field paths (see resources/views/emails/parts/).
 * This hook applies the current form values to the already-rendered iframe
 * document in place — no preview request is ever re-issued after mount.
 */
const applyValuesToDocument = (doc: Document, values: EmailTemplateFormInput) => {
  const logoUrl = resolveLogoUrl(values.logo);
  if (logoUrl) {
    doc.querySelectorAll<HTMLElement>('[data-email-part="logo"]').forEach((el) => {
      if (el.tagName === 'IMG') {
        (el as HTMLImageElement).src = logoUrl;
        return;
      }

      const img = doc.createElement('img');
      img.src = logoUrl;
      img.alt = el.textContent?.trim() ?? '';
      img.setAttribute('data-email-part', 'logo');
      img.style.cssText = 'width: auto; display: inline-block; border: 0;';
      el.replaceWith(img);
    });
  }

  if (values.height) {
    doc.querySelectorAll<HTMLElement>('[data-email-part="logo"]').forEach((el) => {
      el.style.height = `${values.height}px`;
    });
  }

  const align = POSITION_TO_ALIGN[values.position ?? 'center'] ?? 'center';
  doc.querySelectorAll<HTMLElement>('[data-email-part="position"]').forEach((el) => {
    el.style.textAlign = align;
  });

  const colors = values.colors ?? {};
  const colorApplicators: {
    key: keyof NonNullable<EmailTemplateFormInput['colors']>;
    apply: (el: HTMLElement, value: string) => void;
  }[] = [
    { key: 'background', apply: (el, value) => (el.style.backgroundColor = value) },
    { key: 'text', apply: (el, value) => (el.style.color = value) },
    { key: 'link', apply: (el, value) => (el.style.color = value) },
    { key: 'label', apply: (el, value) => (el.style.color = value) },
    { key: 'button', apply: (el, value) => (el.style.color = value) },
    { key: 'button_bg', apply: (el, value) => (el.style.backgroundColor = value) },
  ];

  colorApplicators.forEach(({ key, apply }) => {
    const value = colors[key];
    if (!value) {
      return;
    }
    doc.querySelectorAll<HTMLElement>(`[data-email-part="colors.${key}"]`).forEach((el) => {
      apply(el, value);
    });
  });
};

export const useEmailTemplatePreviewSync = (
  iframeRef: RefObject<HTMLIFrameElement | null>,
  form: UseFormReturn<EmailTemplateFormInput, unknown, EmailTemplateFormPayload>,
  isReady: boolean,
) => {
  useEffect(() => {
    if (!isReady) {
      return;
    }

    const doc = iframeRef.current?.contentDocument;
    if (!doc) {
      return;
    }

    applyValuesToDocument(doc, form.getValues());

    const subscription = form.watch((values) => {
      applyValuesToDocument(doc, values as EmailTemplateFormInput);
    });

    return () => subscription.unsubscribe();
  }, [isReady, iframeRef, form]);
};
