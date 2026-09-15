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
 * `data-email-part="<field path> [<field path> ...]"` attribute (a
 * space-separated list when an element is driven by more than one field),
 * mirrored 1:1 to EmailTemplateFormSchema's field paths (see
 * resources/views/emails/parts/) and matched with the `~=` word selector.
 * This hook applies the current form values to the already-rendered iframe
 * document in place — no preview request is ever re-issued after mount.
 */
const applyValuesToDocument = (doc: Document, values: EmailTemplateFormInput) => {
  const logoUrl = resolveLogoUrl(values.logo);
  if (logoUrl) {
    doc.querySelectorAll<HTMLElement>('[data-email-part~="logo"]').forEach((el) => {
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
    doc.querySelectorAll<HTMLElement>('[data-email-part~="logo"]').forEach((el) => {
      el.style.height = `${values.height}px`;
    });
  }

  const align = POSITION_TO_ALIGN[values.position ?? 'center'] ?? 'center';
  doc.querySelectorAll<HTMLElement>('[data-email-part~="position"]').forEach((el) => {
    el.style.textAlign = align;
  });

  const colors = values.colors ?? {};
  const colorApplicators: {
    path: string;
    value: string | null | undefined;
    apply: (el: HTMLElement, value: string) => void;
  }[] = [
    {
      path: 'colors.background.email_body',
      value: colors.background?.email_body,
      apply: (el, value) => (el.style.backgroundColor = value),
    },
    {
      path: 'colors.background.outer_area',
      value: colors.background?.outer_area,
      apply: (el, value) => (el.style.backgroundColor = value),
    },
    {
      path: 'colors.background.info_cads',
      value: colors.background?.info_cads,
      apply: (el, value) => (el.style.backgroundColor = value),
    },
    {
      path: 'colors.background.divider',
      value: colors.background?.divider,
      apply: (el, value) => (el.style.borderColor = value),
    },
    {
      path: 'colors.typography.headings',
      value: colors.typography?.headings,
      apply: (el, value) => (el.style.color = value),
    },
    {
      path: 'colors.typography.body',
      value: colors.typography?.body,
      apply: (el, value) => (el.style.color = value),
    },
    {
      path: 'colors.typography.muted',
      value: colors.typography?.muted,
      apply: (el, value) => (el.style.color = value),
    },
    {
      path: 'colors.typography.link',
      value: colors.typography?.link,
      apply: (el, value) => (el.style.color = value),
    },
    {
      path: 'colors.typography.exceptions',
      value: colors.typography?.exceptions,
      apply: (el, value) => (el.style.color = value),
    },
    {
      path: 'colors.button.background',
      value: colors.button?.background,
      apply: (el, value) => (el.style.backgroundColor = value),
    },
    {
      path: 'colors.button.text',
      value: colors.button?.text,
      apply: (el, value) => (el.style.color = value),
    },
  ];

  colorApplicators.forEach(({ path, value, apply }) => {
    if (!value) {
      return;
    }
    doc.querySelectorAll<HTMLElement>(`[data-email-part~="${path}"]`).forEach((el) => {
      apply(el, value);
    });
  });

  const contentApplicators: {
    path: 'additional_description' | 'footer';
    value: string | null | undefined;
  }[] = [
    { path: 'additional_description', value: values.additional_description },
    { path: 'footer', value: values.footer },
  ];

  contentApplicators.forEach(({ path, value }) => {
    doc.querySelectorAll<HTMLElement>(`[data-email-part~="${path}"]`).forEach((el) => {
      el.innerHTML = value ?? '';
      const row = el.closest('tr');
      if (row) {
        row.style.display = value ? '' : 'none';
      }
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
