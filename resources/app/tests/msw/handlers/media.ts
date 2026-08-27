import { http,HttpResponse } from 'msw';

const WP_MEDIA_ENDPOINT = 'https://example.test/wp-json/wp/v2/media';

const wpMediaAttachmentResponse = {
  id: 42,
  source_url: 'https://example.test/wp-content/uploads/2026/08/photo.jpg',
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
      thumbnail: { source_url: 'https://example.test/wp-content/uploads/2026/08/photo-150x150.jpg', width: 150, height: 150 },
      medium: { source_url: 'https://example.test/wp-content/uploads/2026/08/photo-300x200.jpg', width: 300, height: 200 },
    },
  },
};

export const handlers = [
  http.post(WP_MEDIA_ENDPOINT, () => {
    return HttpResponse.json(wpMediaAttachmentResponse, { status: 201 });
  }),
];

export { WP_MEDIA_ENDPOINT, wpMediaAttachmentResponse };
