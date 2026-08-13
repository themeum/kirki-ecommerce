import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getErrorMessage } from '@/services/helpers';

type SaveResult = {
  success: boolean;
};

type ResolveSaveFailureOptions = {
  focusOnError?: boolean;
};

/**
 * Applies server-side field errors to the form, decides which field (if
 * any) should receive focus, and builds the toast message — including any
 * errors that didn't resolve to a rendered field.
 */
const resolveSaveFailure = <
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues = TFieldValues,
>(
  form: UseFormReturn<TFieldValues, TContext, TTransformedValues>,
  error: ErrorResponse,
  { focusOnError = true }: ResolveSaveFailureOptions = {},
): SaveResult & { toastMessage: string; focusField: string | null } => {
  const unmatchedMessages: string[] = [];
  const { matchedFields } = applyServerErrors(form, error, {
    onUnmatched: (leftovers) => {
      unmatchedMessages.push(...Object.values(leftovers));
    },
  });

  const focusField = focusOnError && matchedFields[0] ? matchedFields[0] : null;

  if (focusField) {
    form.setFocus(focusField as FieldPath<TFieldValues>);
  }

  return {
    success: false,
    toastMessage: [getErrorMessage(error), ...unmatchedMessages].join(' '),
    focusField,
  };
};

const resolveSaveSuccess = (): SaveResult => ({ success: true });

export { resolveSaveFailure, resolveSaveSuccess, type SaveResult };
