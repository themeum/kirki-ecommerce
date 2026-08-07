import { z } from 'zod';

/**
 * Online payment settings fields are entirely dynamic — driven by the
 * `fields` array the API returns per provider (`DynamicOnlinePaymentFields`) — so there is
 * no fixed field set to declare or name in a transform. Stays a passthrough
 * record, matching the notification records in `email-settings-form.ts`
 * (design.md - Decision 6).
 */
export const OnlinePaymentEditFormSchema = z.record(z.any());

export type OnlinePaymentEditFormInput = z.input<typeof OnlinePaymentEditFormSchema>;

export type OnlinePaymentEditFormPayload = z.output<typeof OnlinePaymentEditFormSchema>;

export const onlinePaymentEditDefaultValues: OnlinePaymentEditFormInput = {};
