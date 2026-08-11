import type { CSSObject } from '@emotion/react';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

import Button from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { useWordpressMedia } from '@/hooks';
import { defineStyles, flexCenter, scopedMerge } from '@/theme/mixins';
import type { MediaRef } from '@/types';
import { __ } from '@/wpi18n';

type MediaItem = Omit<MediaRef, 'id'> & {
  id?: string | number;
};

type MediaFrame = {
  on: (event: string, callback: () => void) => void;
  off: (event: string) => void;
  state: () => {
    get: (key: string) => {
      map: <T>(callback: (attachment: { toJSON: () => MediaItem }) => T) => T[];
    };
  };
  open: () => void;
  modal?: { el?: HTMLElement };
};

export type MediaSelectorProps = {
  title?: string;
  buttonText?: string;
  types?: AcceptedMediaTypes[];
  multiple?: boolean;
  onSelect?: (media: MediaItem | MediaItem[]) => void;
  children?: ReactNode;
  label?: string;
  cssOverride?: CSSObject;
  style?: CSSProperties;
};

type AcceptedMediaTypes = 'image' | 'video' | 'audio' | 'application/pdf' | 'application/zip';

const MediaSelector = ({
  title = __('Select Image(s)', 'kirki-ecommerce'),
  types = ['image'],
  buttonText,
  multiple = false,
  onSelect,
  children,
  label,
  cssOverride,
  style = {},
}: MediaSelectorProps) => {
  const { closeWpMediaFrame, openWpMediaFrame } = useWordpressMedia();
  const mediaFrameRef = useRef<MediaFrame | null>(null);
  const isFrameOpenRef = useRef(false);
  const [selectedImage, setSelectedImage] = useState<MediaItem | MediaItem[]>({
    url: '',
  });
  const [onSelectToggler, setOnSelectToggler] = useState(false);

  useEffect(() => {
    if (onSelect && onSelectToggler) {
      onSelect(selectedImage);
      setOnSelectToggler(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per external toggle to hand back the current pick; re-running on onSelect/selectedImage identity would re-emit the same selection
  }, [onSelectToggler]);

  useEffect(() => {
    if (typeof wp !== 'undefined' && wp?.media) {
      mediaFrameRef.current = wp.media({
        title,
        library: { type: types },
        multiple,
        button: {
          text: buttonText ?? (multiple
            ? __('Use These Images', 'kirki-ecommerce')
            : __('Use This Image', 'kirki-ecommerce')),
        },
      }) as MediaFrame;

      mediaFrameRef.current.on('open', () => {
        isFrameOpenRef.current = true;
        openWpMediaFrame(mediaFrameRef.current?.modal?.el);
      });

      mediaFrameRef.current.on('close', () => {
        isFrameOpenRef.current = false;
        closeWpMediaFrame(mediaFrameRef.current?.modal?.el);
      });

      mediaFrameRef.current.on('select', () => {
        if (!mediaFrameRef.current) {
          return;
        }
        const selection = mediaFrameRef.current.state().get('selection');
        const images = selection.map((attachment) => attachment.toJSON());

        if (multiple) {
          setSelectedImage(images);
          if (onSelect) {
            setOnSelectToggler(true);
          }
        } else {
          const image = images[0];
          setSelectedImage(image);
          if (onSelect) {
            setOnSelectToggler(true);
          }
        }
      });
    }

    return () => {
      if (isFrameOpenRef.current) {
        isFrameOpenRef.current = false;
        closeWpMediaFrame(mediaFrameRef.current?.modal?.el);
      }

      if (mediaFrameRef.current) {
        mediaFrameRef.current.off('select');
        mediaFrameRef.current.off('open');
        mediaFrameRef.current.off('close');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- builds the wp.media frame once on mount — re-running on any prop identity change would discard the frame and its open state
  }, []);

  const openMediaFrame = () => {
    if (mediaFrameRef.current) {
      mediaFrameRef.current.open();
    }
  };

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div
        onClick={openMediaFrame}
        css={scopedMerge(styles.mediaSelector, cssOverride)}
        style={{ cursor: 'pointer', ...style }}
        role="button"
        tabIndex={0}
        aria-label={label || __('Select Image', 'kirki-ecommerce')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openMediaFrame();
          }
        }}
      >
        {children || (
          <Button variant="secondary">
            {__('Select Image', 'kirki-ecommerce')}
          </Button>
        )}
      </div>
    </Field>
  );
};

MediaSelector.displayName = 'MediaSelector';

export default MediaSelector;

const styles = defineStyles({
  mediaSelector: flexCenter(),
});
