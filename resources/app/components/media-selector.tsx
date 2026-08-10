import { CSSObject } from '@emotion/react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import Button from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
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
};

type MediaSelectorProps = {
  multiple?: boolean;
  onSelect?: (media: MediaItem | MediaItem[]) => void;
  children?: ReactNode;
  label?: string;
  cssOverride?: CSSObject;
  style?: CSSProperties;
};

const MediaSelector = ({
  multiple = false,
  onSelect,
  children,
  label,
  cssOverride,
  style = {},
}: MediaSelectorProps) => {
  const mediaFrameRef = useRef<MediaFrame | null>(null);
  const [selectedImage, setSelectedImage] = useState<MediaItem | MediaItem[]>({
    url: '',
  });
  const [onSelectToggler, setOnSelectToggler] = useState(false);

  useEffect(() => {
    if (onSelect && onSelectToggler) {
      onSelect(selectedImage);
      setOnSelectToggler(false);
    }
  }, [onSelectToggler]);

  useEffect(() => {
    if (typeof wp !== 'undefined' && wp?.media) {
      mediaFrameRef.current = wp.media({
        title: __('Select Image(s)', 'kirki-ecommerce'),
        library: { type: 'image' },
        multiple: multiple,
        button: {
          text: multiple
            ? __('Use These Images', 'kirki-ecommerce')
            : __('Use This Image', 'kirki-ecommerce'),
        },
      }) as MediaFrame;

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
      if (mediaFrameRef.current) {
        mediaFrameRef.current.off('select');
      }
    };
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
  mediaSelector: flexCenter()
});
