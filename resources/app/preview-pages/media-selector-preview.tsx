import MediaSelector from '@/components/media-selector';
import Grid from '@/components/ui/grid';
import type { MediaRef } from '@/types';

type MediaItem = Omit<MediaRef, 'id'> & {
  id?: string | number;
};

const MediaSelectorPreview = () => {
  const handleMediaSelect = (image: MediaItem | MediaItem[]) => {
    console.log(image);
  };

  return (
    <Grid>
      <MediaSelector onSelect={handleMediaSelect} multiple={true}>
        + Upload Multiple Images
      </MediaSelector>

      <MediaSelector onSelect={handleMediaSelect} multiple={false}>
        + Upload Single Image
      </MediaSelector>
    </Grid>
  );
};

MediaSelectorPreview.displayName = 'MediaSelectorPreview';

export default MediaSelectorPreview;
