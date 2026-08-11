import Flex from '@/components/ui/flex';
import Thumbnail from '@/components/ui/thumbnail';

type MediaItem = {
  id: number;
  url: string;
  alt: string;
};

const ThumbnailPreview = () => {
  const media_items: MediaItem[] = [
    {
      id: 1,
      url: 'https://images.pexels.com/photos/11136517/pexels-photo-11136517.jpeg',
      alt: 'Image 1',
    },
    {
      id: 2,
      url: 'https://images.pexels.com/photos/11136517/pexels-photo-11136517.jpeg',
      alt: 'Image 2',
    },
    {
      id: 3,
      url: 'https://images.pexels.com/photos/11136517/pexels-photo-11136517.jpeg',
      alt: 'Image 3',
    },
    {
      id: 4,
      url: 'https://images.pexels.com/photos/11136517/pexels-photo-11136517.jpeg',
      alt: 'img 4',
    },
  ];

  return (
    <Flex gap={4} align="center">
      <Thumbnail />
      <Thumbnail src="" />
      <Thumbnail type="circle" />
      <Thumbnail size="small" />
      <Thumbnail size="small" objectFit="contain" src={media_items[0].url} />
      <Thumbnail src={media_items[1].url} />
      <Thumbnail src={media_items[2].url} />
      <Thumbnail src={media_items[3].url} />
    </Flex>
  );
};

ThumbnailPreview.displayName = 'ThumbnailPreview';

export default ThumbnailPreview;
