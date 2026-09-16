import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import type { AdvanceSettingsPage } from '@/schemas/catalog/settings';
import { AdvanceSettingsPageSchema } from '@/schemas/catalog/settings';
import { isDefined } from '@/utils/object';

const AdvanceSettingsFormShape = z.object({
  pages: z.array(AdvanceSettingsPageSchema).default([]),
});

const AdvanceSettingsFormSchema = prepareFormSchema(AdvanceSettingsFormShape).transform((values) => ({
  pages: values.pages.reduce<Partial<Record<AdvanceSettingsPage['key'], number>>>((acc, page) => {
    if (isDefined(page.id)) {
      acc[page.key] = page.id;
    }

    return acc;
  }, {}),
}));

type AdvanceSettingsFormInput = z.input<typeof AdvanceSettingsFormSchema>;

type AdvanceSettingsFormPayload = z.output<typeof AdvanceSettingsFormSchema>;

export { type AdvanceSettingsFormInput, type AdvanceSettingsFormPayload, AdvanceSettingsFormSchema };
