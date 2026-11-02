import z from 'zod';

import { required, stringOrNull } from '@/libs/zod';
import { __ } from '@/wpi18n';

const OrderContactFormSchema = z.object({
  first_name: required(z.string(), __('First name is required', 'kirki-ecommerce')),
  last_name: required(z.string(), __('Last name is required', 'kirki-ecommerce')),
  email: stringOrNull(),
  phone: stringOrNull(),
});

type OrderContactFormInput = z.input<typeof OrderContactFormSchema>;
type OrderContactFormPayload = z.output<typeof OrderContactFormSchema>;

export { type OrderContactFormInput, type OrderContactFormPayload, OrderContactFormSchema };
