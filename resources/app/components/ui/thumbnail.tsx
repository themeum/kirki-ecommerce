import { type SerializedStyles, css } from '@emotion/react';
import {
  forwardRef,
  useEffect,
  useState,
  type ComponentProps,
  type CSSProperties,
} from 'react';
import { Replace, Trash2 } from 'lucide-react';

import MediaSelector from '@/components/media-selector';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { ThumbnailPlaceholder } from '@/icons';
import { theme } from '@/theme';
import { flexCenter, scoped } from '@/theme/mixins';
import type { ThumbnailSize, ThumbnailType } from '@/types';

type MediaSelectorOnSelect = NonNullable<
  ComponentProps<typeof MediaSelector>['onSelect']
>;

type ThumbnailProps = {
  src?: string;
  style?: CSSProperties;
  css?: SerializedStyles;
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
    css: cssProp,
    size,
    type,
    alt,
    objectFit = 'cover',
    label,
    error,
    onChange = () => {},
    helpText,
  } = props;

  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Field
      data-invalid={error ? true : undefined}
      css={css({ maxWidth: '100%' })}
    >
      {label && <FieldLabel>{label}</FieldLabel>}
      <div
        ref={ref}
        css={[
          styles.base,
          size && styles.sizes[size],
          type && styles.types[type],
          error && styles.error,
          cssProp,
        ]}
        style={style}
      >
        {imgSrc ? (
          <>
            <img src={imgSrc} alt={alt || 'thumbnail'} style={{ objectFit }} />
            {size === 'fullWidth' && (
              <div css={[styles.overlay, styles.overlayFullWidth]}>
                <Flex gap={2} css={styles.actions}>
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
      {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
      {typeof error === 'string' && <FieldError>{error}</FieldError>}
    </Field>
  );
});

Thumbnail.displayName = 'Thumbnail';

export default Thumbnail;

const styles = {
  base: scoped({
    height: '40px',
    width: '40px',
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border.default}`,
    ...flexCenter(),
    display: 'inline-flex',
    overflow: 'hidden',
    position: 'relative',
    img: {
      height: '100%',
      width: '100%',
      display: 'block',
    },
  }),
  overlay: scoped({
    position: 'absolute',
    inset: 0,
    background: theme.colors.background.badgeDraft,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.25s ease',
  }),
  overlayFullWidth: scoped({
    padding: theme.spacing[5],
    '&:hover': {
      opacity: 1,
    },
  }),
  actions: scoped({
    paddingBottom: theme.spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  }),
  error: scoped({
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: `0px 0px 0px 1px ${theme.colors.background.fillCritical}`,
  }),
  sizes: {
    small: scoped({
      width: '32px',
      height: '32px',
      borderRadius: theme.radius.sm,
    }),
    xsm: scoped({
      width: '16px',
      height: '16px',
    }),
    fullWidth: scoped({
      padding: theme.spacing[5],
      width: '100%',
      height: 'auto',
      border: `1px solid ${theme.colors.border.gallery}`,
      backgroundColor: theme.colors.background.placeholderSurface,
      boxSizing: 'border-box',
      img: {
        borderRadius: theme.radius.md,
        maxHeight: '202px',
        width: 'auto',
      },
    }),
  },
  types: {
    circle: scoped({
      borderRadius: theme.radius.full,
      border: 'none',
    }),
  },
};
