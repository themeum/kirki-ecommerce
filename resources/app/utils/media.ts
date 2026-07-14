import type { MediaRef } from '@/types';

import { isObject } from '@/utils/object';

export const isMediaObject = (value: unknown): value is MediaRef => {
  if (!isObject(value)) {
    return false;
  }

  return 'id' in value && ('url' in value || 'mime' in value || 'type' in value);
};

export const isVideoObject = (value: MediaRef): boolean => {
  if (value.mime?.startsWith('video/')) {
    return true;
  }

  if (value.type === 'video') {
    return true;
  }

  return Boolean(value.poster);
};
