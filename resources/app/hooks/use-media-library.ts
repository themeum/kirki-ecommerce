import { useRef } from 'react';

import useWordpressMedia from '@/hooks/use-wordpress-media';
import type { MediaRef } from '@/schemas/shared/media';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type MediaItem = Omit<MediaRef, 'id'> & {
  id?: string | number;
};

type UseMediaLibraryOptions = {
  title?: string;
  buttonText?: string;
  multiple?: boolean;
  types?: AcceptedMediaTypes[];
};

const useMediaLibrary = (options: UseMediaLibraryOptions = {}) => {
  const { closeWpMediaFrame, openWpMediaFrame } = useWordpressMedia();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const open = (onSelect: (media: MediaItem | MediaItem[]) => void) => {
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

    const handleClose = () => {
      closeWpMediaFrame(frame.modal?.el);
      teardown();
    };

    const handleSelect = () => {
      const selection = frame.state().get('selection');
      const images = selection.map((attachment) => attachment.toJSON()) as MediaItem[];

      onSelect(multiple ? images : images[0]);
    };

    const teardown = () => {
      frame.off('select');
      frame.off('open');
      frame.off('close');
    };

    frame.on('open', handleOpen);
    frame.on('close', handleClose);
    frame.on('select', handleSelect);

    frame.open();
  };

  return { open };
};

export default useMediaLibrary;
