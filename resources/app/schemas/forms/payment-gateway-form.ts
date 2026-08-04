import { z } from 'zod';

/**
 * Gateway settings fields are entirely dynamic — driven by the `fields`
 * array the API returns per gateway (`DynamicGatewayFields`) — so there is
 * no fixed field set to declare or name in a transform. Stays a passthrough
 * record, matching the notification records in `email-settings-form.ts`
 * (design.md - Decision 6).
 */
export const PaymentGatewayEditFormSchema = z.record(z.any());

export type PaymentGatewayEditFormInput = z.input<typeof PaymentGatewayEditFormSchema>;

export type PaymentGatewayEditFormPayload = z.output<typeof PaymentGatewayEditFormSchema>;

export const paymentGatewayEditDefaultValues: PaymentGatewayEditFormInput = {};
