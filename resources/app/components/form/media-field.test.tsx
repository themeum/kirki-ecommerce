import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FieldValues } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MediaField from '@/components/form/media-field';
import type { MediaRef } from '@/schemas/shared/media';
import { ErrorButton, FormHarness, ValueProbe } from '@/tests/form-field-harness';

const renderField = (defaultValues: FieldValues = { logo: null }) => {
  render(
    <FormHarness defaultValues={defaultValues}>
      <MediaField name="logo" label="Logo" />
      <ValueProbe name="logo" />
      <ErrorButton name="logo" message="Logo is required" />
    </FormHarness>,
  );
};

afterEach(cleanup);

describe('MediaField', () => {
  it('writes the complete media reference to form state when a file is selected', async () => {
    renderField();

    const dropzone = document.querySelector('[data-slot="media-picker"]')!;
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    await vi.waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe-logo').textContent ?? 'null') as MediaRef | null;
      expect(probe?.id).toBe(42);
      expect(probe?.url).toBe('https://example.test/wp-content/uploads/2026/08/photo.jpg');
    });
  });

  it('previews a value hydrated from a complete media reference', () => {
    const logo: MediaRef = { id: 9, url: 'https://example.test/logo.png', alt: 'Store logo' };

    renderField({ logo });

    const preview = document.querySelector('[data-slot="media-picker"] img')!;
    expect(preview).toHaveAttribute('src', 'https://example.test/logo.png');
  });

  it('previews a value hydrated from a bare URL string', () => {
    renderField({ logo: 'https://example.test/legacy-icon.png' });

    const preview = document.querySelector('[data-slot="media-picker"] img')!;
    expect(preview).toHaveAttribute('src', 'https://example.test/legacy-icon.png');
  });

  it('surfaces an injected validation error', () => {
    renderField();

    fireEvent.click(screen.getByRole('button', { name: 'inject-logo' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Logo is required');
    expect(document.querySelector('[data-invalid="true"]')).not.toBeNull();
  });
});
