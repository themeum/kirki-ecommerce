import type { MediaRef } from '@/types';
import { isDefined, isObject } from '@/utils/object';

export const isMediaObject = (value: unknown): value is MediaRef => {
  if (!isObject(value)) {
    return false;
  }

  return isDefined(value.id) && (isDefined(value.url) || isDefined(value.mime) || isDefined(value.type));
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
