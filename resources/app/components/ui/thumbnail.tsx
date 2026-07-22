import {
  forwardRef,
  useEffect,
  useState,
  type ComponentProps,
  type CSSProperties,
} from 'react';
import { Replace, Trash2 } from 'lucide-react';
import classNames from 'classnames';

import MediaSelector from '@/components/media-selector';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { CLASS_PREFIX } from '@/conf';
import { ThumbnailPlaceholder } from '@/icons';
import type { ThumbnailSize, ThumbnailType } from '@/types';

type MediaSelectorOnSelect = NonNullable<
  ComponentProps<typeof MediaSelector>['onSelect']
>;

type ThumbnailProps = {
  src?: string;
  style?: CSSProperties;
  className?: string;
  size?: ThumbnailSize;
  type?: ThumbnailType;
  alt?: string;
  objectFit?: CSSProperties['objectFit'];
  label?: string;
  error?: string | boolean;
  onChange?: (img: Parameters<MediaSelectorOnSelect>[0] | string) => void;
  helpText?: string;
};

const Thumbnail = forwardRef<HTMLDivElement, ThumbnailProps>((props, ref) => {
  const {
    src,
    style = {},
    className,
    size,
    type,
    alt,
    objectFit = 'cover',
    label,
    error,
    onChange = () => {},
    helpText,
  } = props;

  const [imgSrc, setImgSrc] = useState(src);
  const help = typeof error === 'string' ? error : helpText;

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Flex direction="column" gap={8} style={{ maxWidth: '100%' }}>
      {label && (
        <Label error={Boolean(error)} helpText={help}>
          {label}
        </Label>
      )}
      <div
        ref={ref}
        className={classNames(
          `${CLASS_PREFIX}-ui-thumbnail`,
          size && `${CLASS_PREFIX}-ui-thumbnail--${size}`,
          type && `${CLASS_PREFIX}-ui-thumbnail--${type}`,
          error && `${CLASS_PREFIX}-ui-thumbnail--error`,
          className,
        )}
        style={style}
      >
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={alt || 'thumbnail'}
              style={{ objectFit }}
            />
            {size === 'fullWidth' && (
              <div className={`${CLASS_PREFIX}-ui-thumbnail-overlay`}>
                <Flex
                  gap={8}
                  className={`${CLASS_PREFIX}-ui-thumbnail-actions`}
                >
                  <MediaSelector onSelect={(img) => onChange(img)}>
                    <Button size="sm" variant="ghost" aria-label="Replace image">
                      <Replace size={16} aria-hidden="true" />
                    </Button>
                  </MediaSelector>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Remove image"
                    onClick={() => onChange('')}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                </Flex>
              </div>
            )}
          </>
        ) : (
          <ThumbnailPlaceholder />
        )}
      </div>
    </Flex>
  );
});

Thumbnail.displayName = 'Thumbnail';

export default Thumbnail;
