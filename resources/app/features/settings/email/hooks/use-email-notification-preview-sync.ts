import type { RefObject } from 'react';
import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { interpolateShortcodes } from '@/features/settings/email/lib/shortcode';
import type {
  EmailNotificationTemplateFormInput,
  EmailNotificationTemplateFormPayload,
} from '@/features/settings/email/schemas/forms/email-notification-template-form';

/**
 * The heading/message DOM hooks come from `resources/views/emails/layouts/heading.php`
 * (`data-email-part="colors.typography.headings heading"`) and `layouts/body.php`
 * (`data-email-part="body"`). Draft text is interpolated against the preview's
 * `variables` (from `Mailer::get_variables()`) the same way the backend
 * `ShortcodeParser` would, so `{tokens}` resolve live with zero network
 * round-trips — mirroring `use-email-template-preview-sync.ts`'s architecture.
 */
const applyValuesToDocument = (
  doc: Document,
  values: EmailNotificationTemplateFormInput,
  variables: Record<string, unknown>,
) => {
  const heading = interpolateShortcodes(values.heading ?? '', variables);
  doc.querySelectorAll<HTMLElement>('[data-email-part~="heading"]').forEach((el) => {
    el.textContent = heading;
  });

  const message = interpolateShortcodes(values.message ?? '', variables);
  doc.querySelectorAll<HTMLElement>('[data-email-part~="body"]').forEach((el) => {
    el.innerHTML = message;
  });
};

export const useEmailNotificationPreviewSync = (
  iframeRef: RefObject<HTMLIFrameElement | null>,
  form: UseFormReturn<
    EmailNotificationTemplateFormInput,
    unknown,
    EmailNotificationTemplateFormPayload
  >,
  variables: Record<string, unknown>,
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

    const subscription = form.watch((values) => {
      applyValuesToDocument(doc, values, variables);
    });

    return () => subscription.unsubscribe();
  }, [isReady, iframeRef, form, variables]);
};
