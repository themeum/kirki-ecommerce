import { type CSSObject } from '@emotion/react';
import { Replace, Trash2 } from 'lucide-react';
import { type ComponentProps, type CSSProperties, forwardRef, useEffect, useState } from 'react';

import MediaSelector from '@/components/media-selector';
import Button from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { ThumbnailPlaceholder } from '@/icons';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scopedMerge } from '@/theme/mixins';
import type { ThumbnailSize, ThumbnailType } from '@/types';

type MediaSelectorOnSelect = NonNullable<
  ComponentProps<typeof MediaSelector>['onSelect']
>;

type ThumbnailProps = {
  src?: string;
  style?: CSSProperties;
  cssOverride?: CSSObject;
  size?: ThumbnailSize;
  type?: ThumbnailType;
  alt?: string;
  objectFit?: CSSProperties['objectFit'];
  label?: string;
  error?: string | boolean;
  onChange?: (img: Parameters<MediaSelectorOnSelect>[0] | string) => void;
  helpText?: string;
};

const Thumbnail = forwardRef<HTMLDivElement, ThumbnailProps>((props, ref) => {
  const {
    src,
    style = {},
    cssOverride,
    size,
    type,
    alt,
    objectFit = 'cover',
    label,
    error,
    onChange = () => { },
    helpText,
  } = props;

  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const isFieldMode = Boolean(label || helpText || typeof error === 'string');

  const media = (
    <div
      ref={ref}
      css={scopedMerge(
        styles.base,
        size ? styles.sizes[size] : undefined,
        type ? styles.types[type] : undefined,
        error ? styles.error : undefined,
        cssOverride,
      )}
      style={style}
    >
      {imgSrc ? (
        <>
          <img src={imgSrc} alt={alt || 'thumbnail'} style={{ objectFit }} />
          {size === 'fullWidth' && (
            <div css={scopedMerge(styles.overlay, styles.overlayFullWidth)}>
              <Flex gap={2} cssOverride={styles.actions}>
                <MediaSelector onSelect={(img) => onChange(img)}>
                  <Button variant="ghost" aria-label="Replace image">
                    <Replace size={16} aria-hidden="true" />
                  </Button>
                </MediaSelector>
                <Button
                  variant="ghost"
                  aria-label="Remove image"
                  onClick={() => onChange('')}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </Flex>
            </div>
          )}
        </>
      ) : (
        <ThumbnailPlaceholder />
      )}
    </div>
  );

  if (!isFieldMode) {
    return media;
  }

  return (
    <Field
      data-invalid={error ? true : undefined}
      cssOverride={{ maxWidth: '100%' }}
    >
      {label && <FieldLabel>{label}</FieldLabel>}
      {media}
      {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
      {typeof error === 'string' && <FieldError>{error}</FieldError>}
    </Field>
  );
});

Thumbnail.displayName = 'Thumbnail';

export default Thumbnail;

const styles = defineStyles({
  base: {
    height: '40px',
    width: '40px',
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border.default}`,
    ...flexCenter(),
    display: 'inline-flex',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    img: {
      height: '100%',
      width: '100%',
      display: 'block',
    },
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: theme.colors.background.badgeDraft,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.25s ease',
  },
  overlayFullWidth: {
    padding: theme.spacing[5],
    '&:hover': {
      opacity: 1,
    },
  },
  actions: {
    paddingBottom: theme.spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: `0px 0px 0px 1px ${theme.colors.background.fillCritical}`,
  },
  sizes: {
    small: {
      width: '32px',
      height: '32px',
      borderRadius: theme.radius.sm,
    },
    xsm: {
      width: '16px',
      height: '16px',
    },
    fullWidth: {
      padding: theme.spacing[5],
      width: '100%',
      height: 'auto',
      border: `1px solid ${theme.colors.border.gallery}`,
      backgroundColor: theme.colors.background.placeholderSurface,
      img: {
        borderRadius: theme.radius.md,
        maxHeight: '202px',
        width: 'auto',
      },
    },
  },
  types: {
    circle: {
      borderRadius: theme.radius.full,
      border: 'none',
    },
  },
});
