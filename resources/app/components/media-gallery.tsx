import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type CSSObject } from '@emotion/react';
import { useState } from 'react';

import MediaSelector from '@/components/media-selector';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { MoveIcon, PlusIcon, TrashIcon } from '@/icons';
import type { MediaRef } from '@/schemas/shared/media';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped, scopedMerge } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type MediaItem = Omit<MediaRef, 'id'> & {
  id?: string | number;
};

type SortableData = {
  sortable: {
    index: number;
  };
};

type SortableItemProps = {
  id: string;
  index: number;
  url: string;
  alt?: string;
  cssOverride?: CSSObject;
  onSelectImage?: (value: boolean) => void;
  onDeleteImage?: () => void;
  selectedImages?: number[];
  isLarge?: boolean;
  disableDrag?: boolean;
};

const SortableItem = ({
  id,
  index,
  url,
  alt = '',
  cssOverride,
  onSelectImage = noop,
  onDeleteImage = noop,
  selectedImages = [],
  isLarge,
  disableDrag,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: disableDrag });

  const style = defineStyles({
    transform: CSS.Transform.toString(transform),
    transition,
  });

  const scaleX = transform?.scaleX;
  const scaleY = transform?.scaleY;

  const ThresholdValue = 0.01;

  const normalizedScaleX =
    scaleX === undefined
      ? scaleX
      : Math.abs(scaleX - 1) < ThresholdValue
        ? 1
        : scaleX > 1
          ? 0.5
          : scaleX < 1
            ? 1.5
            : scaleX;

  const normalizedScaleY =
    scaleY === undefined
      ? scaleY
      : Math.abs(scaleY - 1) < ThresholdValue
        ? 1
        : scaleY > 1
          ? 0.5
          : scaleY < 1
            ? 1.5
            : scaleY;

  const isActive = Boolean(selectedImages?.includes(index));

  return (
    <div
      ref={setNodeRef}
      style={style}
      css={scopedMerge(styles.galleryItem, isLarge && styles.galleryItemLarge, cssOverride)}
      {...attributes}
    >
      <div
        css={scopedMerge(styles.itemOverlay, isActive && styles.itemActive)}
        data-gallery-overlay
        {...listeners}
      >
        {!disableDrag && (
          <Button
            variant="ghost"
            aria-label={__('Move', 'kirki-ecommerce')}
            {...listeners}
            style={{
              transform: isDragging
                ? `scale(${normalizedScaleX}, ${normalizedScaleY})`
                : '',
            }}
            cssOverride={styles.dragHandlerButton}
          >
            <MoveIcon {...(isLarge ? { width: '20', height: '20' } : {})} />
          </Button>
        )}
      </div>
      {!isDragging && (
        <div
          css={scopedMerge(styles.itemActions, isActive && styles.itemActive)}
          data-gallery-actions
        >
          <Checkbox
            value={selectedImages?.includes(index)}
            onChange={(v: boolean) => onSelectImage(v)}
          />
          {!selectedImages?.length && (
            <Button
              variant="ghost"
              aria-label={__('Delete', 'kirki-ecommerce')}
              onClick={onDeleteImage}
            >
              <TrashIcon color={theme.colors.text.critical} />
            </Button>
          )}
        </div>
      )}
      {url && <img src={url} alt={alt || ''} />}
    </div>
  );
};

type MediaGalleryProps = {
  mediaItems?: MediaItem[];
  label?: string;
  onUpdate?: (items: MediaItem[]) => void;
  error?: string | boolean;
  helpText?: string;
};

const MediaGallery = ({
  mediaItems = [],
  label = '',
  onUpdate = noop,
  error,
  helpText,
}: MediaGalleryProps) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const oldIndex = (active.data.current as SortableData).sortable.index;
    const newIndex = (over.data.current as SortableData).sortable.index;

    if (oldIndex === newIndex) {
      return;
    }

    const newOrder = arrayMove(mediaItems, oldIndex, newIndex);
    onUpdate?.(newOrder);
  };

  const handleOnAddNewImages = (newImages: MediaItem | MediaItem[]) => {
    const images = Array.isArray(newImages) ? newImages : [newImages];
    const updatedImages = [...mediaItems, ...images];
    onUpdate?.(updatedImages);
  };

  const visibleItems = expanded ? mediaItems : mediaItems?.slice(0, 3);
  const remainingCount = mediaItems?.length > 3 ? mediaItems?.length - 3 : 0;
  const fourthItem = mediaItems[3] || { url: '' };

  const updateSelectedImageList = (value: boolean, currentIndex: number) => {
    if (value) {
      const updatedList = [...selectedImages, currentIndex];
      setSelectedImages(updatedList);
    } else {
      const filteredList = selectedImages?.filter(
        (_item, index) => index !== currentIndex,
      );
      setSelectedImages(filteredList);
    }
  };

  const handleSelectAllImages = () => {
    if (selectedImages?.length < mediaItems?.length) {
      const allMedia = mediaItems?.map((_item, index) => index);
      setSelectedImages(allMedia);
    } else {
      setSelectedImages([]);
    }
  };

  const handleDeleteSelectedImages = () => {
    const filteredMediaItems = mediaItems?.filter(
      (_item, index) => !selectedImages?.includes(index),
    );
    setSelectedImages([]);
    onUpdate(filteredMediaItems);
  };

  const handleDeleteSingleImage = (currentIndex: number) => {
    setSelectedImages((prev) =>
      prev.filter((_item, index) => index !== currentIndex),
    );
    const filteredMedia = mediaItems?.filter(
      (_item, index) => index !== currentIndex,
    );
    onUpdate(filteredMedia);
  };

  return (
    <Flex direction="column" gap={2}>
      {selectedImages?.length > 0 ? (
        <Flex align="center" justify="space-between">
          <Checkbox
            value={selectedImages?.length === mediaItems?.length}
            label={`${selectedImages?.length} ${selectedImages?.length > 1 ? 'files' : 'file'
              } selected`}
            isPartialChecked={
              selectedImages?.length < mediaItems?.length &&
              selectedImages?.length !== 0
            }
            onChange={() => handleSelectAllImages()}
          />
          <Button
            variant="link"
            cssOverride={styles.deleteButton}
            onClick={handleDeleteSelectedImages}
          >
            {__('Delete', 'kirki-ecommerce')}
          </Button>
        </Flex>
      ) : (
        <>
          {label && (
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel style={{ minHeight: '23px' }}>{label}</FieldLabel>
              {helpText && !error && (
                <FieldDescription>{helpText}</FieldDescription>
              )}
              {typeof error === 'string' && <FieldError>{error}</FieldError>}
            </Field>
          )}
        </>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
      >
        <SortableContext
          items={mediaItems.map((img, index) => `${img.id}-${index}`)}
          strategy={rectSortingStrategy}
        >
          <div css={scoped(styles.mediaGallery)}>
            {visibleItems.map((img, index) => {
              const isLarge = index === 0;

              return (
                <SortableItem
                  index={index}
                  key={`${img.id}-${index}`}
                  disableDrag={selectedImages?.length > 0}
                  id={`${img.id}-${index}`}
                  url={img.url}
                  alt={img.alt || ''}
                  isLarge={isLarge}
                  selectedImages={selectedImages}
                  onSelectImage={(value) =>
                    updateSelectedImageList(value, index)
                  }
                  onDeleteImage={() => handleDeleteSingleImage(index)}
                />
              );
            })}

            {!expanded && remainingCount > 0 && (
              <button
                type="button"
                css={scopedMerge(styles.galleryItem, styles.remainingOverlay)}
                onClick={() => setExpanded(true)}
              >
                {fourthItem.url && (
                  <img src={fourthItem.url} alt={fourthItem.alt || ''} />
                )}
                <div css={scoped(styles.remainingOverlayText)}>+{remainingCount}</div>
              </button>
            )}

            <MediaSelector onSelect={handleOnAddNewImages} multiple={true}>
              <div css={scopedMerge(styles.galleryItem, styles.addItem)}>
                <PlusIcon height={24} width={24} />
              </div>
            </MediaSelector>
          </div>
        </SortableContext>
      </DndContext>
    </Flex>
  );
};

export default MediaGallery;

const styles = defineStyles({
  mediaGallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))',
    gap: theme.spacing[3],
  },
  galleryItem: {
    aspectRatio: '1 / 1',
    overflow: 'hidden',
    position: 'relative',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.background.surface}`,
    userSelect: 'none',
    img: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
    },
    '&:hover [data-gallery-overlay], &:hover [data-gallery-actions]': {
      opacity: 1,
    },
  },
  galleryItemLarge: {
    gridColumn: 'span 2',
    gridRow: 'span 2',
  },
  itemOverlay: {
    position: 'absolute',
    inset: 0,
    background: theme.colors.background.badgeDraft,
    opacity: 0,
    transition: 'opacity 0.2s ease',
    zIndex: 2,
    ...flexCenter(),
  },
  itemActive: {
    opacity: 1,
  },
  itemActions: {
    position: 'absolute',
    top: '8px',
    left: '6px',
    right: '6px',
    zIndex: 3,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    opacity: 0,
    transition: 'opacity 0.2s ease',
  },
  remainingOverlay: {
    padding: 0,
    border: 'none',
    background: 'none',
    font: 'inherit',
    cursor: 'pointer',
    img: {
      transform: 'scale(1.05)',
    },
  },
  remainingOverlayText: {
    position: 'absolute',
    inset: 0,
    ...theme.typography.large('normal'),
    color: theme.colors.text.light,
    background: theme.colors.background.badgeDraft,
    borderRadius: 'inherit',
    ...flexCenter(),
  },
  addItem: {
    border: `2px dashed ${theme.colors.border.gallery}`,
    color: theme.colors.background.fillBrand,
    cursor: 'pointer',
    background: theme.colors.background.surfaceSecondary,
    ...flexCenter(),
    '&:hover': {
      background: theme.colors.background.galleryHover,
    },
    minHeight: '8.5rem',
    minWidth: '8.5rem',
  },
  dragHandlerButton: {
    borderRadius: theme.radius.full,
    cursor: 'grab',
    '&:active': {
      cursor: 'grabbing',
    },
  },
  deleteButton: {
    color: theme.colors.text.critical,
  },
});
