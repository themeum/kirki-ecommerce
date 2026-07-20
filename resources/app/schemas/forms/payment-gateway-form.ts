import { z } from 'zod';

export const PaymentGatewayEditFormSchema = z.record(z.any());

export type PaymentGatewayEditFormValues = z.infer<
  typeof PaymentGatewayEditFormSchema
>;

export const paymentGatewayEditDefaultValues: PaymentGatewayEditFormValues =
  {} as PaymentGatewayEditFormValues;
