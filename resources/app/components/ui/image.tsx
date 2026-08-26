import { type CSSObject } from '@emotion/react';
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  forwardRef,
  useEffect,
  useState,
} from 'react';

import placeholder from '@/assets/placeholder.svg';
import Skeleton from '@/components/ui/skeleton';
import type { MediaRef } from '@/schemas/shared/media';
import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';
import { isObject } from '@/utils/object';

type ImageSize = 'xs' | 'sm' | 'md' | 'full';
type ImageShape = 'square' | 'circle';
type ImageFit = 'cover' | 'contain' | 'fill' | 'none';

type ImageProps = Omit<
  ComponentPropsWithoutRef<'img'>,
  'className' | 'css' | 'src' | 'width' | 'height'
> & {
  src?: MediaRef | string | null;
  size?: ImageSize;
  shape?: ImageShape;
  fit?: ImageFit;
  fallbackSrc?: string;
  showSkeleton?: boolean;
  width?: string | number;
  height?: string | number;
  cssOverride?: CSSObject;
};

const SIZE_HINTS: Record<ImageSize, string> = {
  xs: '16px',
  sm: '32px',
  md: '40px',
  full: '100vw',
};

type ResolvedSource = {
  url: string;
  srcSet?: string;
  alt?: string;
};

const toCssLength = (value: string | number) => {
  return typeof value === 'number' ? `${value}px` : value;
};

const resolveSource = (src: ImageProps['src']): ResolvedSource | null => {
  if (typeof src === 'string') {
    return src ? { url: src } : null;
  }

  if (!isObject(src)) {
    return null;
  }

  const media = src;

  if (!media.url) {
    return null;
  }

  const candidates = Object.values(media.sizes ?? {})
    .filter((size) => Boolean(size?.url) && Boolean(size?.width))
    .map((size) => `${size.url} ${size.width}w`);

  return {
    url: media.url,
    srcSet: candidates.length > 0 ? candidates.join(', ') : undefined,
    alt: media.alt,
  };
};

const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  const {
    src,
    alt,
    size = 'md',
    shape = 'square',
    fit = 'cover',
    fallbackSrc = placeholder,
    showSkeleton = true,
    width,
    height,
    style,
    loading = 'lazy',
    decoding = 'async',
    onLoad,
    onError,
    cssOverride,
    ...rest
  } = props;

  const resolved = resolveSource(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [resolved?.url]);

  const showFallback = !resolved || hasError;
  const resolvedAlt = alt ?? resolved?.alt ?? '';

  const handleLoad: NonNullable<ImageProps['onLoad']> = (event) => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  const handleError: NonNullable<ImageProps['onError']> = (event) => {
    setHasError(true);
    onError?.(event);
  };

  const hasExplicitDimensions = width !== undefined || height !== undefined;

  const boxStyle: CSSProperties = {
    ...(width !== undefined ? { width: toCssLength(width) } : {}),
    ...(height !== undefined ? { height: toCssLength(height) } : {}),
    ...style,
  };

  const isFullWidth = size === 'full';
  const showLoadingSkeleton = showSkeleton && !showFallback && !isLoaded;

  return (
    <span
      data-slot="image"
      data-shape={shape}
      data-size={size}
      style={boxStyle}
      css={scopedMerge(
        styles.base,
        hasExplicitDimensions ? undefined : styles.sizes[size],
        styles.shapes[shape],
        cssOverride,
      )}
    >
      {showLoadingSkeleton ? (
        <Skeleton
          height={isFullWidth ? 160 : undefined}
          cssOverride={isFullWidth ? styles.fullWidthSkeleton : styles.overlaySkeleton}
          radius={!isFullWidth && shape === 'circle' ? 'full' : undefined}
        />
      ) : null}
      <img
        ref={ref}
        src={showFallback ? fallbackSrc : resolved.url}
        srcSet={showFallback ? undefined : resolved?.srcSet}
        sizes={showFallback || !resolved?.srcSet ? undefined : SIZE_HINTS[size]}
        alt={resolvedAlt}
        loading={loading}
        decoding={decoding}
        css={scopedMerge(
          isFullWidth ? styles.imgFullWidth : styles.img,
          isFullWidth ? undefined : styles.fits[fit],
          showLoadingSkeleton ? (isFullWidth ? styles.imgHidden : styles.imgLoading) : undefined,
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...rest}
      />
    </span>
  );
});

Image.displayName = 'Image';

export default Image;
export type { ImageFit, ImageProps, ImageShape, ImageSize };

const styles = defineStyles({
  base: {
    position: 'relative',
    display: 'inline-flex',
    flexShrink: 0,
    overflow: 'hidden',
    verticalAlign: 'middle',
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border.default}`,
  },
  sizes: {
    xs: { width: '16px', height: '16px' },
    sm: { width: '32px', height: '32px', borderRadius: theme.radius.sm },
    md: { width: '40px', height: '40px' },
    full: {
      width: '100%',
      height: 'auto',
      padding: theme.spacing[5],
      border: `1px solid ${theme.colors.border.gallery}`,
      backgroundColor: theme.colors.background.placeholderSurface,
    },
  },
  shapes: {
    square: {},
    circle: {
      borderRadius: theme.radius.full,
      border: 'none',
    },
  },
  img: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    display: 'block',
    transition: 'opacity 200ms ease',
  },
  imgFullWidth: {
    display: 'block',
    width: 'auto',
    maxWidth: '100%',
    maxHeight: '202px',
    margin: '0 auto',
    borderRadius: theme.radius.md,
  },
  imgLoading: {
    opacity: 0,
  },
  imgHidden: {
    display: 'none',
  },
  fits: {
    cover: { objectFit: 'cover' },
    contain: { objectFit: 'contain' },
    fill: { objectFit: 'fill' },
    none: { objectFit: 'none' },
  },
  overlaySkeleton: {
    position: 'absolute',
    inset: 0,
  },
  fullWidthSkeleton: {
    width: '100%',
  },
});
