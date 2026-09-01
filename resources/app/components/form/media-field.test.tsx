import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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

    await vi.waitFor(() => {
      const preview = document.querySelector('[data-slot="media-picker"] img');
      expect(preview).toHaveAttribute('src', 'https://example.test/wp-content/uploads/2026/08/photo.jpg');
    });
  });

  it('previews a media item picked from the WordPress media library', async () => {
    const attachmentJSON = {
      id: 77,
      filename: 'photo.jpg',
      url: 'https://example.test/wp-content/uploads/2026/08/photo.jpg',
      alt: 'A selected photo',
      mime: 'image/jpeg',
      type: 'image',
      height: 800,
      width: 1200,
      sizes: {
        full: {
          height: 800,
          width: 1200,
          url: 'https://example.test/wp-content/uploads/2026/08/photo.jpg',
          orientation: 'landscape',
        },
      },
    };

    let selectCallback: (() => void) | undefined;

    const frame = {
      on: vi.fn((event: string, callback: () => void) => {
        if (event === 'select') {
          selectCallback = callback;
        }
      }),
      off: vi.fn(),
      state: () => ({
        get: () => ({
          map: (cb: (attachment: { toJSON: () => unknown }) => unknown) =>
            [{ toJSON: () => attachmentJSON }].map(cb),
        }),
      }),
      open: vi.fn(),
      modal: { el: document.createElement('div') },
    };

    (window as unknown as { wp: { media: (opts: unknown) => typeof frame } }).wp = {
      media: () => frame,
    };

    renderField();

    fireEvent.click(screen.getByRole('button', { name: 'Upload image' }));
    expect(frame.open).toHaveBeenCalled();

    act(() => {
      selectCallback?.();
    });

    await vi.waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe-logo').textContent ?? 'null') as MediaRef | null;
      expect(probe?.url).toBe('https://example.test/wp-content/uploads/2026/08/photo.jpg');
    });

    const preview = document.querySelector('[data-slot="media-picker"] img');
    expect(preview).toHaveAttribute('src', 'https://example.test/wp-content/uploads/2026/08/photo.jpg');

    delete (window as { wp?: unknown }).wp;
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
