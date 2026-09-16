import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import { __ } from '@/wpi18n';

const StateRefSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().optional(),
  name: z.string().optional(),
  flag: z.string().optional(),
  code: z.string().optional(),
});

const AddStatesPopupFormShape = z.object({
  selectedStates: z
    .array(StateRefSchema)
    .min(1, __('Select at least one state', 'kirki-ecommerce')),
});

export const AddStatesPopupFormSchema = prepareFormSchema(AddStatesPopupFormShape).transform((values) => ({
  selectedStates: values.selectedStates,
}));

export type AddStatesPopupFormInput = z.input<typeof AddStatesPopupFormSchema>;

export type AddStatesPopupFormPayload = z.output<typeof AddStatesPopupFormSchema>;
