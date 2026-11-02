import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MediaGallery from '@/components/media-gallery';

afterEach(() => {
  cleanup();
  delete (window as { wp?: unknown }).wp;
});

const installFakeWpMedia = () => {
  const frame = {
    on: vi.fn(),
    off: vi.fn(),
    open: vi.fn(),
    state: vi.fn(),
    modal: { el: document.createElement('div') },
  };
  const media = vi.fn(() => frame);

  (window as unknown as { wp: { media: typeof media } }).wp = { media };

  return media;
};

const openLibrary = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add images' }));
};

describe('MediaGallery', () => {
  it('opens the media library restricted to images by default', () => {
    const media = installFakeWpMedia();

    render(<MediaGallery />);
    openLibrary();

    expect(media).toHaveBeenCalledWith(
      expect.objectContaining({ library: { type: ['image'] }, multiple: true }),
    );
  });

  it('opens the media library with the accepted types it is given', () => {
    const media = installFakeWpMedia();

    render(<MediaGallery accept={['image', 'video']} />);
    openLibrary();

    expect(media).toHaveBeenCalledWith(
      expect.objectContaining({ library: { type: ['image', 'video'] } }),
    );
  });
});
