import { type CSSObject } from '@emotion/react';
import { ImagePlus, Replace, Trash2 } from 'lucide-react';
import { type DragEvent, forwardRef, useRef, useState } from 'react';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import { useMediaLibrary } from '@/hooks';
import { CloudUpload } from '@/icons';
import type { MediaRef } from '@/schemas/shared/media';
import { uploadMedia } from '@/services/media';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scopedMerge } from '@/theme/mixins';
import { isVideoObject } from '@/utils/media';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type MediaPickerValue = MediaRef | string | null;

type MediaPickerProps = {
  value?: MediaPickerValue;
  onChange: (media: MediaRef | null) => void;
  onRequestOpen?: () => void;
  accept?: AcceptedMediaTypes[];
  placeholder?: string;
  btnText?: string;
  size?: 'small' | 'fullWidth';
  disabled?: boolean;
  error?: boolean;
  onError?: (message: string) => void;
  cssOverride?: CSSObject;
};

const MIME_MATCHERS: Record<AcceptedMediaTypes, (mime: string) => boolean> = {
  image: (mime) => mime.startsWith('image/'),
  video: (mime) => mime.startsWith('video/'),
  audio: (mime) => mime.startsWith('audio/'),
  'application/pdf': (mime) => mime === 'application/pdf',
  'application/zip': (mime) =>
    mime === 'application/zip' || mime === 'application/x-zip-compressed',
};

const matchesAccept = (file: File, accept: AcceptedMediaTypes[]) => {
  return accept.some((type) => MIME_MATCHERS[type](file.type));
};

const hasValue = (value: MediaPickerValue): value is MediaRef | string => {
  return isDefined(value) && value !== '';
};

const resolvePreviewSrc = (value: MediaPickerValue): MediaRef | string | null => {
  if (!hasValue(value)) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (isVideoObject(value)) {
    return value.poster ?? null;
  }

  return value;
};

const MediaPicker = forwardRef<HTMLDivElement, MediaPickerProps>((props, ref) => {
  const {
    value = null,
    onChange,
    onRequestOpen,
    accept = ['image'],
    placeholder = __('Drag and drop, or upload image', 'kirki-ecommerce'),
    btnText = __('Upload image', 'kirki-ecommerce'),
    size = 'fullWidth',
    disabled = false,
    error = false,
    onError,
    cssOverride,
  } = props;

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dragDepthRef = useRef(0);

  const { open: openLibrary } = useMediaLibrary({ types: accept, multiple: false });

  const isBusy = disabled || isUploading;

  const openBrowse = () => {
    if (isBusy) {
      return;
    }

    if (onRequestOpen) {
      onRequestOpen();
      return;
    }

    openLibrary((media) => {
      const selected = Array.isArray(media) ? media[0] : media;

      if (selected) {
        onChange(selected);
      }
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (isBusy || !files || files.length === 0) {
      return;
    }

    const file = files[0];

    if (!matchesAccept(file, accept)) {
      onError?.(__('This file type is not supported.', 'kirki-ecommerce'));
      return;
    }

    setIsUploading(true);

    try {
      const media = await uploadMedia(file);
      onChange(media);
    } catch (uploadError) {
      onError?.(
        uploadError instanceof Error
          ? uploadError.message
          : __('Upload failed.', 'kirki-ecommerce'),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);

    if (isBusy) {
      return;
    }

    void handleFiles(event.dataTransfer.files);
  };

  const handleRemove = () => {
    if (isBusy) {
      return;
    }

    onChange(null);
  };

  const previewSrc = resolvePreviewSrc(value);

  if (previewSrc && size === 'small') {
    return (
      <div
        ref={ref}
        data-slot="media-picker"
        data-size="small"
        css={scopedMerge(styles.smallFilled, error && styles.error, cssOverride)}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          type="button"
          disabled={isBusy}
          onClick={openBrowse}
          css={scopedMerge(styles.smallTrigger)}
          aria-label={btnText}
        >
          <Image src={previewSrc} size="sm" loading="eager" cssOverride={styles.smallImage} />
        </button>
        {isUploading && (
          <span css={scopedMerge(styles.smallSpinnerOverlay)}>
            <Spinner />
          </span>
        )}
      </div>
    );
  }

  if (!previewSrc && size === 'small') {
    return (
      <div
        ref={ref}
        data-slot="media-picker"
        data-size="small"
        css={scopedMerge(
          styles.smallEmpty,
          isDragging && styles.dragging,
          error && styles.error,
          cssOverride,
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          type="button"
          disabled={isBusy}
          onClick={openBrowse}
          css={scopedMerge(styles.smallTrigger)}
          aria-label={btnText}
        >
          <ImagePlus />
        </button>
        {isUploading && (
          <span css={scopedMerge(styles.smallSpinnerOverlay)}>
            <Spinner />
          </span>
        )}
      </div>
    );
  }

  if (previewSrc) {
    return (
      <div
        ref={ref}
        data-slot="media-picker"
        data-size="fullWidth"
        css={scopedMerge(styles.filledWrapper, error && styles.error, cssOverride)}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Image src={previewSrc} size="full" loading="eager" cssOverride={styles.filledImage} />
        <div css={scopedMerge(styles.overlay, isDragging && styles.overlayVisible)}>
          <Flex gap={2} cssOverride={styles.overlayActions}>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label={__('Replace image', 'kirki-ecommerce')}
              disabled={isBusy}
              onClick={openBrowse}
            >
              <Replace size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label={__('Remove image', 'kirki-ecommerce')}
              disabled={isBusy}
              onClick={handleRemove}
            >
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          </Flex>
        </div>
        {isUploading && (
          <div css={scopedMerge(styles.uploadOverlay)}>
            <Spinner />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-slot="media-picker"
      data-size="fullWidth"
      css={scopedMerge(
        styles.emptyWrapper,
        isDragging && styles.dragging,
        error && styles.error,
        cssOverride,
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Flex direction="column" align="center" gap={2}>
        <Button variant="ghost" type="button" disabled={isBusy} onClick={openBrowse}>
          <CloudUpload />
          {btnText}
        </Button>
        <Text color="secondary">{placeholder}</Text>
      </Flex>
      {isUploading && (
        <div css={scopedMerge(styles.uploadOverlay)}>
          <Spinner />
        </div>
      )}
    </div>
  );
});

MediaPicker.displayName = 'MediaPicker';

export default MediaPicker;
export type { MediaPickerProps };

const styles = defineStyles({
  emptyWrapper: {
    position: 'relative',
    height: '137px',
    width: '100%',
    borderRadius: theme.radius.md,
    border: `1px dashed ${theme.colors.border.gallery}`,
    backgroundColor: theme.colors.background.placeholderSurface,
    ...flexCenter(),
    transition: 'border-color 150ms ease, background-color 150ms ease',
  },
  dragging: {
    borderColor: theme.colors.border.ring,
    backgroundColor: theme.colors.background.fillSecondary,
  },
  error: {
    borderColor: theme.colors.border.critical,
    boxShadow: `0px 0px 0px 1px ${theme.colors.background.fillCritical}`,
  },
  filledWrapper: {
    position: 'relative',
    width: '100%',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  filledImage: {
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: theme.colors.background.badgeDraft,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: theme.spacing[5],
    opacity: 0,
    transition: 'opacity 0.25s ease',
    '&:hover': {
      opacity: 1,
    },
  },
  overlayVisible: {
    opacity: 1,
  },
  overlayActions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.spacing[1],
  },
  uploadOverlay: {
    position: 'absolute',
    inset: 0,
    ...flexCenter(),
    backgroundColor: theme.colors.background.badgeDraft,
  },
  smallEmpty: {
    position: 'relative',
    width: '32px',
    height: '32px',
    borderRadius: theme.radius.sm,
    border: `1px dashed ${theme.colors.border.default}`,
    ...flexCenter(),
  },
  smallFilled: {
    position: 'relative',
    width: '32px',
    height: '32px',
  },
  smallTrigger: {
    all: 'unset',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    '& svg': {
      width: '14px',
      height: '14px',
    },
  },
  smallImage: {
    pointerEvents: 'none',
  },
  smallSpinnerOverlay: {
    position: 'absolute',
    inset: 0,
    ...flexCenter(),
    backgroundColor: theme.colors.background.badgeDraft,
    borderRadius: theme.radius.sm,
  },
});
