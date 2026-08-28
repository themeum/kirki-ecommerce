import { useRef } from 'react';

import useWordpressMedia from '@/hooks/use-wordpress-media';
import type { MediaRef, MediaSize } from '@/schemas/shared/media';
import { isDefined, isObject } from '@/utils/object';
import { __ } from '@/wpi18n';

type UseMediaLibraryOptions = {
  title?: string;
  buttonText?: string;
  multiple?: boolean;
  types?: AcceptedMediaTypes[];
};

const toMediaSize = (value: unknown): MediaSize | null => {
  if (!isObject(value) || typeof value.url !== 'string' || typeof value.width !== 'number' || typeof value.height !== 'number') {
    return null;
  }

  return {
    url: value.url,
    width: value.width,
    height: value.height,
    orientation: value.orientation === 'portrait' || value.orientation === 'landscape' ? value.orientation : undefined,
  };
};

/**
 * The Backbone attachment JSON `wp.media` selection events hand back comes
 * from the classic admin-ajax `query-attachments` action, not the REST API
 * `uploadMedia()` talks to — normalize it the same defensive way so a
 * malformed/partial attachment can't reach `Image` as an unchecked cast.
 */
const normalizeWpAttachment = (json: Record<string, unknown>): MediaRef | null => {
  const { id, url } = json;

  if ((typeof id !== 'number' && typeof id !== 'string') || typeof url !== 'string') {
    return null;
  }

  const sizeEntries = Object.entries(isObject(json.sizes) ? json.sizes : {})
    .map(([key, value]) => [key, toMediaSize(value)] as const)
    .filter((entry): entry is [string, MediaSize] => entry[1] !== null);

  return {
    id,
    url,
    filename: typeof json.filename === 'string' ? json.filename : undefined,
    sizes: sizeEntries.length > 0 ? Object.fromEntries(sizeEntries) : undefined,
    width: typeof json.width === 'number' ? json.width : undefined,
    height: typeof json.height === 'number' ? json.height : undefined,
    mime: typeof json.mime === 'string' ? json.mime : undefined,
    type: typeof json.type === 'string' ? json.type : undefined,
    alt: typeof json.alt === 'string' ? json.alt : undefined,
  };
};

const useMediaLibrary = (options: UseMediaLibraryOptions = {}) => {
  const { closeWpMediaFrame, openWpMediaFrame } = useWordpressMedia();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const open = (onSelect: (media: MediaRef | MediaRef[]) => void) => {
    if (!isDefined(wp) || !isDefined(wp.media)) {
      return;
    }

    const { title, buttonText, multiple = false, types = ['image'] } = optionsRef.current;

    const frame = wp.media({
      title: title ?? __('Select Image(s)', 'kirki-ecommerce'),
      library: { type: types },
      multiple,
      button: {
        text:
          buttonText ??
          (multiple ? __('Use These Images', 'kirki-ecommerce') : __('Use This Image', 'kirki-ecommerce')),
      },
    });

    const handleOpen = () => {
      openWpMediaFrame(frame.modal?.el);
    };

    /**
     * The toolbar's "select" button handler calls `frame.close()` before it
     * triggers the `select` event (see `Toolbar.Select#clickSelect` in WP
     * core), so `close` always fires first even on a confirmed selection.
     * Tearing down the `select` listener here would remove it before it
     * ever runs — only clean up `open`/`close` themselves.
     */
    const handleClose = () => {
      closeWpMediaFrame(frame.modal?.el);
      frame.off('open');
      frame.off('close');
    };

    const handleSelect = () => {
      const selection = frame.state().get('selection');
      const images = selection
        .map((attachment) => normalizeWpAttachment(attachment.toJSON()))
        .filter((media): media is MediaRef => media !== null);

      frame.off('select');

      if (images.length === 0) {
        return;
      }

      onSelect(multiple ? images : images[0]);
    };

    frame.on('open', handleOpen);
    frame.on('close', handleClose);
    frame.on('select', handleSelect);

    frame.open();
  };

  return { open };
};

export default useMediaLibrary;
