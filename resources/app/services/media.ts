import axios from 'axios';

import type { MediaRef } from '@/schemas/shared/media';
import { __ } from '@/wpi18n';

type WpMediaRestSize = {
  source_url: string;
  width?: number;
  height?: number;
};

type WpMediaRestResponse = {
  id: number;
  source_url: string;
  alt_text?: string;
  mime_type?: string;
  media_type?: string;
  title?: { rendered?: string };
  date?: string;
  media_details?: {
    width?: number;
    height?: number;
    filesize?: number;
    sizes?: Record<string, WpMediaRestSize>;
  };
};

const normalizeWpMediaResponse = (payload: WpMediaRestResponse): MediaRef => {
  const sizes = payload.media_details?.sizes;

  return {
    id: payload.id,
    url: payload.source_url,
    filename: payload.title?.rendered,
    sizes: sizes
      ? Object.fromEntries(
          Object.entries(sizes).map(([key, size]) => [
            key,
            { url: size.source_url, width: size.width ?? 0, height: size.height ?? 0 },
          ]),
        )
      : undefined,
    width: payload.media_details?.width,
    height: payload.media_details?.height,
    filesize: payload.media_details?.filesize,
    mime: payload.mime_type,
    type: payload.media_type,
    alt: payload.alt_text,
    date: payload.date,
  };
};

const extractUploadErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? __('Something went wrong.', 'kirki-ecommerce');
  }

  return __('Something went wrong.', 'kirki-ecommerce');
};

const uploadMedia = async (file: File): Promise<MediaRef> => {
  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    const response = await axios.post<WpMediaRestResponse>(
      `${window.kirki_ecommerce.site_url.replace(/\/$/, '')}/wp-json/wp/v2/media`,
      formData,
      {
        headers: {
          'X-WP-Nonce': window.kirki_ecommerce.rest_nonce,
          'Content-Disposition': `attachment; filename="${file.name}"`,
        },
      },
    );

    return normalizeWpMediaResponse(response.data);
  } catch (error) {
    throw new Error(extractUploadErrorMessage(error));
  }
};

export { normalizeWpMediaResponse, uploadMedia };
