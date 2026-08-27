import { http,HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { normalizeWpMediaResponse, uploadMedia } from '@/services/media';
import { server } from '@/tests/msw/server';

describe('normalizeWpMediaResponse', () => {
  it('maps a core media response with generated sizes onto MediaRef', () => {
    const media = normalizeWpMediaResponse({
      id: 42,
      source_url: 'https://example.test/photo.jpg',
      alt_text: 'A photo',
      mime_type: 'image/jpeg',
      media_type: 'image',
      title: { rendered: 'photo.jpg' },
      date: '2026-08-26T10:00:00',
      media_details: {
        width: 1200,
        height: 800,
        filesize: 204800,
        sizes: {
          thumbnail: { source_url: 'https://example.test/photo-150x150.jpg', width: 150, height: 150 },
        },
      },
    });

    expect(media).toEqual({
      id: 42,
      url: 'https://example.test/photo.jpg',
      filename: 'photo.jpg',
      sizes: {
        thumbnail: { url: 'https://example.test/photo-150x150.jpg', width: 150, height: 150 },
      },
      width: 1200,
      height: 800,
      filesize: 204800,
      mime: 'image/jpeg',
      type: 'image',
      alt: 'A photo',
      date: '2026-08-26T10:00:00',
    });
  });

  it('leaves sizes undefined when the response has no generated sizes', () => {
    const media = normalizeWpMediaResponse({
      id: 7,
      source_url: 'https://example.test/file.pdf',
      mime_type: 'application/pdf',
      media_type: 'file',
    });

    expect(media.sizes).toBeUndefined();
    expect(media.url).toBe('https://example.test/file.pdf');
  });
});

describe('uploadMedia', () => {
  it('uploads a file and returns the normalized media reference', async () => {
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

    const media = await uploadMedia(file);

    expect(media.id).toBe(42);
    expect(media.url).toBe('https://example.test/wp-content/uploads/2026/08/photo.jpg');
    expect(media.sizes?.thumbnail?.width).toBe(150);
  });

  it('surfaces the server error message on failure', async () => {
    server.use(
      http.post('https://example.test/wp-json/wp/v2/media', () => {
        return HttpResponse.json({ message: 'File is too large.' }, { status: 400 });
      }),
    );

    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

    await expect(uploadMedia(file)).rejects.toThrow('File is too large.');
  });
});
