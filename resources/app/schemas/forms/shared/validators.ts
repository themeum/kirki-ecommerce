import { z } from 'zod';

import { MoneyAmountSchema } from '@/schemas/shared/api';
import { MediaRefSchema } from '@/schemas/shared/media';
import { __ } from '@/wpi18n';

const requiredString = (message?: string) =>
  z
    .string()
    .min(1, message ?? __('This field is required', 'kirki-ecommerce'));

const optionalNullableString = () => z.string().optional().nullable();

const slug = (message?: string) =>
  z
    .string()
    .min(1, message ?? __('Slug is required', 'kirki-ecommerce'));

const email = (message?: string) =>
  z
    .string()
    .min(1, message ?? __('Email is required', 'kirki-ecommerce'))
    .email(message ?? __('Please enter a valid email', 'kirki-ecommerce'));

const moneyAmount = MoneyAmountSchema;

const mediaRef = MediaRefSchema;

export {
  requiredString,
  optionalNullableString,
  slug,
  email,
  moneyAmount,
  mediaRef,
};
