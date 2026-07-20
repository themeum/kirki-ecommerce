import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

import { getErrorsObject, type ErrorResponse } from '@/libs/api';

type ApplyServerErrorsOptions = {
  stripPrefix?: string;
};

const applyServerErrors = <TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  error: ErrorResponse,
  options: ApplyServerErrorsOptions = {},
): void => {
  const { stripPrefix = 'data.' } = options;
  const fieldErrors = getErrorsObject(error.errors);
  Object.entries(fieldErrors).forEach(([key, message]) => {
    if (!message) {
      return;
    }

    const fieldName = key.startsWith(stripPrefix)
      ? key.slice(stripPrefix.length)
      : key;

    form.setError(fieldName as FieldPath<TFieldValues>, {
      message: String(message),
    });
  });
};

export { applyServerErrors };
