import type { UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { resolveSaveFailure, resolveSaveSuccess } from '@/features/products/lib/save-result';
import type { ErrorResponse } from '@/libs/api';

type FormValues = {
  title: string;
};

const buildError = (errors: Record<string, string>, message = 'Something went wrong.'): ErrorResponse =>
  ({ message, errors, success: false }) as ErrorResponse;

const buildForm = (values: FormValues) => {
  const setError = vi.fn();
  const setFocus = vi.fn();
  const getValues = vi.fn(() => values);

  const form = { setError, setFocus, getValues } as unknown as UseFormReturn<FormValues>;

  return { form, setError, setFocus, getValues };
};

describe('resolveSaveSuccess', () => {
  it('reports a clean save as successful', () => {
    expect(resolveSaveSuccess()).toEqual({ success: true });
  });
});

describe('resolveSaveFailure', () => {
  it('applies a matched field error and focuses it', () => {
    const { form, setError, setFocus } = buildForm({ title: '' });
    const error = buildError({ 'data.title': 'Title is required' });

    const result = resolveSaveFailure(form, error);

    expect(setError).toHaveBeenCalledWith('title', { message: 'Title is required' });
    expect(setFocus).toHaveBeenCalledWith('title');
    expect(result).toEqual({
      success: false,
      toastMessage: 'Something went wrong.',
      focusField: 'title',
    });
  });

  it('does not focus a matched field when focusOnError is false', () => {
    const { form, setFocus } = buildForm({ title: '' });
    const error = buildError({ 'data.title': 'Title is required' });

    const result = resolveSaveFailure(form, error, { focusOnError: false });

    expect(setFocus).not.toHaveBeenCalled();
    expect(result.focusField).toBeNull();
  });

  it('collects an unmatched error into the toast message without focusing anything', () => {
    const { form, setError, setFocus } = buildForm({ title: '' });
    const error = buildError({ 'data.unknown_field': 'Unknown field failed' }, 'Save failed.');

    const result = resolveSaveFailure(form, error);

    expect(setError).not.toHaveBeenCalled();
    expect(setFocus).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      toastMessage: 'Save failed. Unknown field failed',
      focusField: null,
    });
  });

  it('handles a mix of matched and unmatched errors, focusing only the matched field', () => {
    const { form, setError, setFocus } = buildForm({ title: '' });
    const error = buildError({
      'data.title': 'Title is required',
      'data.unknown_field': 'Unknown field failed',
    }, 'Save failed.');

    const result = resolveSaveFailure(form, error);

    expect(setError).toHaveBeenCalledWith('title', { message: 'Title is required' });
    expect(setFocus).toHaveBeenCalledWith('title');
    expect(result).toEqual({
      success: false,
      toastMessage: 'Save failed. Unknown field failed',
      focusField: 'title',
    });
  });
});
