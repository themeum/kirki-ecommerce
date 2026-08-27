import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Image from '@/components/ui/image';
import type { MediaRef } from '@/schemas/shared/media';

afterEach(cleanup);

const buildMediaRef = (overrides: Partial<MediaRef> = {}): MediaRef => ({
  id: 12,
  url: 'https://example.test/wp-content/uploads/original.jpg',
  alt: 'A product photo',
  ...overrides,
});

describe('Image', () => {
  it('renders a plain string source', () => {
    render(<Image src="https://example.test/logo.png" alt="Logo" />);

    expect(screen.getByRole('img', { name: 'Logo' })).toHaveAttribute(
      'src',
      'https://example.test/logo.png',
    );
  });

  it('renders the fallback when there is no source', () => {
    render(<Image src={null} fallbackSrc="/fallback.svg" alt="" />);

    const img = document.querySelector('[data-slot="image"] img')!;
    expect(img).toHaveAttribute('src', '/fallback.svg');
  });

  it('renders the fallback after the source fails to load', () => {
    render(<Image src="https://example.test/broken.jpg" fallbackSrc="/fallback.svg" alt="Broken" />);

    const img = document.querySelector('[data-slot="image"] img')!;
    fireEvent.error(img);

    expect(img).toHaveAttribute('src', '/fallback.svg');
  });

  it('derives a srcSet from a media reference sizes map', () => {
    const media = buildMediaRef({
      sizes: {
        thumbnail: { url: 'https://example.test/thumb.jpg', width: 150, height: 150 },
        medium: { url: 'https://example.test/medium.jpg', width: 300, height: 300 },
      },
    });

    render(<Image src={media} />);

    const img = document.querySelector('[data-slot="image"] img')!;
    expect(img.getAttribute('srcset')).toBe(
      'https://example.test/thumb.jpg 150w, https://example.test/medium.jpg 300w',
    );
  });

  it('renders a single source when the media reference has no generated sizes', () => {
    const media = buildMediaRef();

    render(<Image src={media} />);

    const img = document.querySelector('[data-slot="image"] img')!;
    expect(img).not.toHaveAttribute('srcset');
    expect(img).toHaveAttribute('src', media.url);
  });

  it('takes alt text from the media reference when the caller supplies none', () => {
    const media = buildMediaRef({ alt: 'Reference alt text' });

    render(<Image src={media} />);

    expect(screen.getByRole('img', { name: 'Reference alt text' })).toBeInTheDocument();
  });

  it('prefers a caller-supplied alt over the media reference', () => {
    const media = buildMediaRef({ alt: 'Reference alt text' });

    render(<Image src={media} alt="Caller alt" />);

    expect(screen.getByRole('img', { name: 'Caller alt' })).toBeInTheDocument();
  });

  it('applies the requested size and shape', () => {
    render(<Image src="https://example.test/logo.png" size="sm" shape="circle" alt="" />);

    const wrapper = document.querySelector('[data-slot="image"]')!;
    expect(wrapper).toHaveAttribute('data-size', 'sm');
    expect(wrapper).toHaveAttribute('data-shape', 'circle');
  });

  it('falls back to the plain url when a srcSet candidate fails, before giving up to the placeholder', () => {
    const media = buildMediaRef({
      url: 'https://example.test/wp-content/uploads/original.jpg',
      sizes: {
        thumbnail: { url: 'https://example.test/thumb.jpg', width: 150, height: 150 },
      },
    });

    render(<Image src={media} fallbackSrc="/fallback.svg" alt="Photo" />);

    const img = document.querySelector('[data-slot="image"] img')!;
    expect(img).toHaveAttribute('srcset');

    fireEvent.error(img);

    expect(img).not.toHaveAttribute('srcset');
    expect(img).toHaveAttribute('src', media.url);

    fireEvent.error(img);

    expect(img).toHaveAttribute('src', '/fallback.svg');
  });

  it('treats an already-cached image as loaded without waiting for a load event', () => {
    const completeSpy = vi
      .spyOn(window.HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(true);
    const widthSpy = vi
      .spyOn(window.HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(200);

    render(<Image src="https://example.test/cached.jpg" alt="Photo" />);

    const wrapper = document.querySelector('[data-slot="image"]')!;
    expect(wrapper.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();

    completeSpy.mockRestore();
    widthSpy.mockRestore();
  });

  it('retries the plain url when a cached srcSet candidate is already a known failure', () => {
    const completeSpy = vi
      .spyOn(window.HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(true);
    const widthSpy = vi
      .spyOn(window.HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(0);

    const media = buildMediaRef({
      url: 'https://example.test/wp-content/uploads/original.jpg',
      sizes: {
        thumbnail: { url: 'https://example.test/thumb.jpg', width: 150, height: 150 },
      },
    });

    render(<Image src={media} fallbackSrc="/fallback.svg" alt="Photo" />);

    const img = document.querySelector('[data-slot="image"] img')!;
    expect(img).not.toHaveAttribute('srcset');
    expect(img).toHaveAttribute('src', media.url);

    completeSpy.mockRestore();
    widthSpy.mockRestore();
  });

  it('retries a new source after a previous one failed', () => {
    const { rerender } = render(
      <Image src="https://example.test/broken.jpg" fallbackSrc="/fallback.svg" alt="Photo" />,
    );

    const img = document.querySelector('[data-slot="image"] img')!;
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/fallback.svg');

    rerender(<Image src="https://example.test/working.jpg" fallbackSrc="/fallback.svg" alt="Photo" />);

    expect(img).toHaveAttribute('src', 'https://example.test/working.jpg');
  });
});
