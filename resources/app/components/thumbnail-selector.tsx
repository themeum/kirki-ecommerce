import MediaSelector from '@/components/media-selector';
import Button from '@/components/ui/button';
import { CloudUpload } from '@/icons';
import Placeholder from '@/components/ui/placeholder';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import type { LabelFieldProps, MediaRef, ThumbnailSize } from '@/types';
import { __ } from '@/wpi18n';

type MediaItem = Omit<MediaRef, 'id'> & {
  id?: string | number;
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
            <Button variant="ghost">
              <CloudUpload />
              {btnText}
            </Button>
          </MediaSelector>
          <Text color="secondary">{placeholder}</Text>
        </Placeholder>
      )}
    </>
  );
};

export default ThumbnailSelector;
