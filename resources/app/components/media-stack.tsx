import type { CSSProperties } from 'react';

import Image, { type ImageSize } from '@/components/ui/image';
import { scoped } from '@/theme/mixins';

type MediaStackItem = {
  url?: string;
  [key: string]: unknown;
};

type MediaStackProps = {
  mediaArray?: MediaStackItem[];
  size?: ImageSize;
  style?: CSSProperties;
};

const MediaStack = (props: MediaStackProps) => {
  const { mediaArray = [], size = 'sm' } = props;
  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      {mediaArray.length === 0 ? (
        <Image src="" size={size} />
      ) : mediaArray.length === 1 ? (
        <Image size={size} src={mediaArray[0]?.url} />
      ) : (
        <>
          <Image size={size} src={mediaArray[1]?.url} />
          <div
            css={scoped({
              position: 'absolute',
              transform: 'rotate(12deg)',
              top: 0,
              left: 0,
              zIndex: '2',
            })}
          >
            <Image size={size} src={mediaArray[0]?.url} />
          </div>
        </>
      )}
    </div>
  );
};

export default MediaStack;
