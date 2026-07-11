import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
import { __ } from '@/wpi18n';

type MediaItem = {
  id?: number;
  url: string;
  alt?: string;
  [key: string]: unknown;
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
  className?: string;
  style?: CSSProperties;
};

const MediaSelector = ({
  multiple = false,
  onSelect,
  children,
  label,
  className = '',
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
    <Flex direction="column" gap={8}>
      {label && <Label text={label} />}
      <div
        onClick={openMediaFrame}
        className={className}
        style={{ cursor: 'pointer', ...style }}
      >
        {children || <Button text={__('Select Image', 'kirki-ecommerce')} />}
      </div>
    </Flex>
  );
};

export default MediaSelector;
