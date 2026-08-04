import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

import { getErrorsObject, type ErrorResponse } from '@/libs/api';

type ApplyServerErrorsOptions = {
  stripPrefix?: string;
  /**
   * When provided, only keys that resolve to a primitive leaf in the form's
   * current values are applied with setError; everything else (unknown
   * keys, or keys pointing at an object/array such as a relation ref) is
   * handed back here instead of silently no-oping on an unrendered field.
   */
  onUnmatched?: (leftovers: Record<string, string>) => void;
};

type ApplyServerErrorsResult = {
  matchedFields: string[];
};

const resolvePath = (
  source: unknown,
  path: string,
): { exists: boolean; value: unknown } => {
  const segments = path.split('.');
  let current = source;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return { exists: false, value: undefined };
    }

    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return { exists: false, value: undefined };
      }
      current = current[index];
      continue;
    }

    if (typeof current !== 'object' || !(segment in current)) {
      return { exists: false, value: undefined };
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return { exists: true, value: current };
};

const applyServerErrors = <TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  error: ErrorResponse,
  options: ApplyServerErrorsOptions = {},
): ApplyServerErrorsResult => {
  const { stripPrefix = 'data.', onUnmatched } = options;
  const fieldErrors = getErrorsObject(error.errors);
  const values = onUnmatched ? form.getValues() : undefined;
  const matchedFields: string[] = [];
  const unmatched: Record<string, string> = {};

  Object.entries(fieldErrors).forEach(([key, message]) => {
    if (!message) {
      return;
    }

    const fieldName = key.startsWith(stripPrefix)
      ? key.slice(stripPrefix.length)
      : key;

    if (onUnmatched) {
      const { exists, value } = resolvePath(values, fieldName);
      const isLeaf = value === null || typeof value !== 'object';
      if (!exists || !isLeaf) {
        unmatched[fieldName] = String(message);
        return;
      }
    }

    form.setError(fieldName as FieldPath<TFieldValues>, {
      message: String(message),
    });
    matchedFields.push(fieldName);
  });

  if (onUnmatched && Object.keys(unmatched).length > 0) {
    onUnmatched(unmatched);
  }

  return { matchedFields };
};

export { applyServerErrors };
