import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MediaPicker from '@/components/media-picker';
import type { MediaRef } from '@/schemas/shared/media';

afterEach(cleanup);

const buildFile = (name: string, type: string) => new File(['content'], name, { type });

const dropFiles = (element: Element, files: File[]) => {
  fireEvent.drop(element, { dataTransfer: { files } });
};

describe('MediaPicker', () => {
  it('rejects a dropped file whose type is not accepted, without uploading', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();

    render(<MediaPicker value={null} onChange={onChange} onError={onError} accept={['image']} />);

    const dropzone = document.querySelector('[data-slot="media-picker"]')!;
    dropFiles(dropzone, [buildFile('notes.txt', 'text/plain')]);

    await screen.findByText('Upload image');

    expect(onChange).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('not supported'));
  });

  it('uploads a dropped file and emits the resulting media reference', async () => {
    const onChange = vi.fn();

    render(<MediaPicker value={null} onChange={onChange} accept={['image']} />);

    const dropzone = document.querySelector('[data-slot="media-picker"]')!;
    dropFiles(dropzone, [buildFile('photo.jpg', 'image/jpeg')]);

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

    const media = onChange.mock.calls[0][0] as MediaRef;
    expect(media.id).toBe(42);
    expect(media.url).toBe('https://example.test/wp-content/uploads/2026/08/photo.jpg');
  });

  it('uploads only the first file when several are dropped', async () => {
    const onChange = vi.fn();

    render(<MediaPicker value={null} onChange={onChange} accept={['image']} />);

    const dropzone = document.querySelector('[data-slot="media-picker"]')!;
    dropFiles(dropzone, [buildFile('first.jpg', 'image/jpeg'), buildFile('second.jpg', 'image/jpeg')]);

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  });

  it('emits null when the held item is removed', () => {
    const onChange = vi.fn();
    const value: MediaRef = { id: 1, url: 'https://example.test/logo.png' };

    render(<MediaPicker value={value} onChange={onChange} size="fullWidth" />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('ignores a drop while an upload is already in progress', async () => {
    const onChange = vi.fn();

    render(<MediaPicker value={null} onChange={onChange} accept={['image']} />);

    const dropzone = document.querySelector('[data-slot="media-picker"]')!;
    dropFiles(dropzone, [buildFile('first.jpg', 'image/jpeg')]);
    dropFiles(dropzone, [buildFile('second.jpg', 'image/jpeg')]);

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  });
});
