import type { CSSProperties, ComponentProps } from 'react';
import classNames from 'classnames';
import { useState, useEffect } from 'react';

import { CLASS_PREFIX } from '@/conf';
import { ReplaceIcon, ThumbnailPlaceholder, TrashEmptyIcon } from '@/icons';
import Label from '@/molecules/label';
import Flex from '@/molecules/flex';
import Button from '@/molecules/button';
import MediaSelector from '@/components/media-selector';
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

const Thumbnail = ({
  src,
  style = {},
  className = '',
  size,
  type,
  alt,
  objectFit = 'cover',
  label,
  error,
  onChange = () => {},
  helpText,
}: ThumbnailProps) => {
  const thumbnailVariants = {
    size: {
      fullWidth: `${CLASS_PREFIX}-thumbnail-full-width`,
      small: `${CLASS_PREFIX}-thumbnail-small`,
      xsm: `${CLASS_PREFIX}-thumbnail-xsm`,
    },
    type: {
      circle: `${CLASS_PREFIX}-thumbnail-circle`,
    },
    error: `${CLASS_PREFIX}-thumbnail-error`,
    default: `${CLASS_PREFIX}-thumbnail`,
  };
  const allClassNames = classNames(
    thumbnailVariants.default,
    size && thumbnailVariants.size[size],
    type && thumbnailVariants.type[type],
    error && thumbnailVariants.error,
    className,
  );

  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Flex direction="column" gap={8} style={{ maxWidth: '100%' }}>
      {label && (
        <Label
          text={label}
          type={error ? 'error' : ''}
          helpText={error ? error : helpText}
        />
      )}
      <div className={allClassNames} style={style}>
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={alt || 'thumbnail'}
              style={{ objectFit: objectFit }}
            />
            {size === 'fullWidth' && (
              <div className={`${CLASS_PREFIX}-thumbnail-overlay`}>
                <Flex gap={8} className={`${CLASS_PREFIX}-action-buttons`}>
                  <MediaSelector onSelect={(img) => onChange(img)}>
                    <Button size="small" type="ghost" icon={<ReplaceIcon />} />
                  </MediaSelector>
                  <Button
                    size="small"
                    type="ghost"
                    icon={<TrashEmptyIcon />}
                    onClick={() => onChange('')}
                  />
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
};

export default Thumbnail;
