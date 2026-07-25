import MediaSelector from '@/components/media-selector';
import { ThumbnailPlaceholder } from '@/icons';
import Flex from '@/components/ui/flex';
import Placeholder from '@/components/ui/placeholder';

const PlaceholderPreview = () => {
  const handlePlaceholderClick = () => {
    console.log('clicked');
  };

  return (
    <Flex direction="column" gap={4}>
      <MediaSelector label="Small Placeholder" style={{ width: 'max-content' }}>
        <Placeholder size="small" />
      </MediaSelector>

      <MediaSelector
        label="Small Primary Placeholder"
        style={{ width: 'max-content' }}
      >
        <Placeholder size="small" type="primary" />
      </MediaSelector>

      <Placeholder label="Default Placeholder" type="primary">
        <ThumbnailPlaceholder />
        <MediaSelector multiple={true}>
          <span>Add Image</span>
        </MediaSelector>
      </Placeholder>

      <Placeholder type="secondary" label="Secondary Placeholder">
        <ThumbnailPlaceholder />
        <MediaSelector multiple={true}>
          <span>Add Image</span>
        </MediaSelector>
      </Placeholder>

      <Placeholder
        label="Large Secondary Placeholder"
        type="secondary"
        size="large"
        onClick={handlePlaceholderClick}
      >
        <ThumbnailPlaceholder />
        <MediaSelector>
          <span>Add Image</span>
        </MediaSelector>
      </Placeholder>
    </Flex>
  );
};

PlaceholderPreview.displayName = 'PlaceholderPreview';

export default PlaceholderPreview;
