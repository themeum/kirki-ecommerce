import { useState } from 'react';

import MediaGallery from '@/components/media-gallery';

type MediaItem = {
  id?: number;
  url: string;
  alt?: string;
};

const mediaItems: MediaItem[] = [
  {
    id: 1,
    url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/10/img1.jpeg',
    alt: 'Image 1',
  },
  {
    id: 2,
    url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/10/img5.jpeg',
    alt: 'Image 2',
  },
  {
    id: 3,
    url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/10/img4.jpeg',
    alt: 'Image 3',
  },
  {
    id: 4,
    url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/10/img2.jpeg',
    alt: 'Image 4',
  },
  {
    id: 5,
    url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/08/Frozen-lake-frozen-world-2560x1600-1.jpg',
    alt: 'Image 5',
  },
  {
    id: 6,
    url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/10/img3.jpeg',
    alt: 'Image 6',
  },
  {
    id: 7,
    url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/04/img17.jpeg',
    alt: 'Image 7',
  },
  {
    id: 8,
    url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/04/img4.jpeg',
    alt: 'Image 8',
  },
  {
    id: 9,
    url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/04/img2.jpeg',
    alt: 'Image 9',
  },
];

const MediaGalleryPreview = () => {
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>(mediaItems);

  const handleGalleryUpdate = (items: MediaItem[]) => {
    setGalleryItems(items);
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <MediaGallery mediaItems={galleryItems} onUpdate={handleGalleryUpdate} />
    </div>
  );
};

MediaGalleryPreview.displayName = 'MediaGalleryPreview';

export default MediaGalleryPreview;
