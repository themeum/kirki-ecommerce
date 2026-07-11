import MediaSelector from '@/components/media-selector';
import { CloudUpload } from '@/icons';
import Button from '@/molecules/button';
import Placeholder from '@/molecules/placeholder';
import Text from '@/molecules/text';
import Thumbnail from '@/molecules/thumbnail';
import type { LabelFieldProps, ThumbnailSize } from '@/types';
import { __ } from '@/wpi18n';

type MediaItem = {
  id?: number;
  url: string;
  alt?: string;
  [key: string]: unknown;
};

type ThumbnailSelectorProps = LabelFieldProps & {
  onChange?: (media: MediaItem | MediaItem[]) => void;
  src?: string;
  placeholder?: string;
  btnText?: string;
  size?: ThumbnailSize;
};

const ThumbnailSelector = (props: ThumbnailSelectorProps) => {
  const {
    onChange = () => {},
    error,
    src,
    placeholder = __('Drag and drop, or upload image', 'kirki-ecommerce'),
    btnText = __('Upload image', 'kirki-ecommerce'),
    label,
    helpText,
    size = 'fullWidth',
  } = props;

  const handleThumbnailChange = (img: MediaItem | MediaItem[] | string) => {
    if (typeof img === 'string') {
      onChange({ url: img });
      return;
    }
    onChange(img);
  };

  return (
    <>
      {src ? (
        <>
          {size === 'small' ? (
            <MediaSelector onSelect={onChange}>
              <Thumbnail
                src={src}
                size={size}
                label={label}
                onChange={handleThumbnailChange}
                helpText={helpText}
              />
            </MediaSelector>
          ) : (
            <Thumbnail
              src={src}
              size="fullWidth"
              label={label}
              onChange={handleThumbnailChange}
              helpText={helpText}
            />
          )}
        </>
      ) : size === 'small' ? (
        <MediaSelector onSelect={onChange}>
          <Placeholder
            size={size}
            type="primary"
            error={error}
            helpText={helpText}
          />
        </MediaSelector>
      ) : (
        <Placeholder
          type="primary"
          label={label}
          error={error}
          helpText={helpText}
        >
          <MediaSelector onSelect={onChange}>
            <Button type="ghost" text={btnText} leftIcon={<CloudUpload />} />
          </MediaSelector>
          <Text type="primary" subHeader={placeholder} />
        </Placeholder>
      )}
    </>
  );
};

export default ThumbnailSelector;
