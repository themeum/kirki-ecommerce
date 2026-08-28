import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import useMediaLibrary from '@/hooks/use-media-library';
import type { MediaRef } from '@/schemas/shared/media';

afterEach(() => {
  delete (window as { wp?: unknown }).wp;
});

/**
 * Shaped like `wp_prepare_attachment_for_js()` — the classic admin-ajax
 * payload `wp.media`'s Backbone selection hands back, not the REST API
 * shape `uploadMedia()` normalizes.
 */
const buildAttachmentJSON = (overrides: Record<string, unknown> = {}) => ({
  id: 77,
  title: 'photo',
  filename: 'photo.jpg',
  url: 'https://example.test/wp-content/uploads/2026/08/photo.jpg',
  link: 'https://example.test/photo',
  alt: 'A selected photo',
  author: '1',
  mime: 'image/jpeg',
  type: 'image',
  subtype: 'jpeg',
  filesizeInBytes: 12345,
  height: 800,
  width: 1200,
  orientation: 'landscape',
  sizes: {
    thumbnail: {
      height: 150,
      width: 150,
      url: 'https://example.test/wp-content/uploads/2026/08/photo-150x150.jpg',
      orientation: 'landscape',
    },
    full: {
      height: 800,
      width: 1200,
      url: 'https://example.test/wp-content/uploads/2026/08/photo.jpg',
      orientation: 'landscape',
    },
  },
  ...overrides,
});

const installFakeWpMedia = (attachmentJSON: Record<string, unknown>) => {
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

  return {
    frame,
    triggerSelect: () => selectCallback?.(),
  };
};

describe('useMediaLibrary', () => {
  it('normalizes a selected library attachment into a MediaRef', () => {
    const { triggerSelect } = installFakeWpMedia(buildAttachmentJSON());
    const { result } = renderHook(() => useMediaLibrary());
    const onSelect = vi.fn();

    act(() => {
      result.current.open(onSelect);
    });
    act(() => {
      triggerSelect();
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    const media = onSelect.mock.calls[0][0] as MediaRef;
    expect(media.id).toBe(77);
    expect(media.url).toBe('https://example.test/wp-content/uploads/2026/08/photo.jpg');
    expect(media.mime).toBe('image/jpeg');
    expect(media.sizes?.thumbnail?.url).toBe(
      'https://example.test/wp-content/uploads/2026/08/photo-150x150.jpg',
    );
  });

  it('drops a selected attachment missing a usable url instead of forwarding a broken value', () => {
    const { triggerSelect } = installFakeWpMedia(buildAttachmentJSON({ url: undefined }));
    const { result } = renderHook(() => useMediaLibrary());
    const onSelect = vi.fn();

    act(() => {
      result.current.open(onSelect);
    });
    act(() => {
      triggerSelect();
    });

    expect(onSelect).not.toHaveBeenCalled();
  });
});
