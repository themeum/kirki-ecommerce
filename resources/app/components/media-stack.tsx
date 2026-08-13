import type { CSSProperties } from 'react';

import Thumbnail from '@/components/ui/thumbnail';
import type { ThumbnailSize } from '@/types/components/common';

type MediaStackItem = {
  url?: string;
  [key: string]: unknown;
};

type MediaStackProps = {
  mediaArray?: MediaStackItem[];
  size?: ThumbnailSize;
  style?: CSSProperties;
};

const MediaStack = (props: MediaStackProps) => {
  const { mediaArray = [], size = 'small' } = props;
  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      {mediaArray.length === 0 ? (
        <Thumbnail src="" size={size} />
      ) : mediaArray.length === 1 ? (
        <Thumbnail size={size} src={mediaArray[0]?.url} />
      ) : (
        <>
          <Thumbnail size={size} src={mediaArray[1]?.url} />
          <div
            style={{
              position: 'absolute',
              transform: 'rotate(12deg)',
              top: 0,
              left: 0,
              zIndex: '2',
            }}
          >
            <Thumbnail size={size} src={mediaArray[0]?.url} />
          </div>
        </>
      )}
    </div>
  );
};

export default MediaStack;
