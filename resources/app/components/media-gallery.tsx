import { type SerializedStyles } from '@emotion/react';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import MediaSelector from '@/components/media-selector';
import Button from '@/components/ui/button';
import { MoveIcon, PlusIcon, TrashIcon } from '@/icons';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { theme } from '@/theme';
import { flexCenter, scoped } from '@/theme/mixins';
import type { MediaRef } from '@/types';
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
  css?: SerializedStyles;
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
  css: cssProp,
  onSelectImage = () => {},
  onDeleteImage = () => {},
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      css={[styles.galleryItem, isLarge && styles.galleryItemLarge, cssProp]}
      {...attributes}
    >
      <div
        css={[styles.itemOverlay, isActive && styles.itemActive]}
        data-gallery-overlay
        {...listeners}
      >
        {!disableDrag && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={__('Move', 'kirki-ecommerce')}
            {...listeners}
            style={{
              transform: isDragging
                ? `scale(${normalizedScaleX}, ${normalizedScaleY})`
                : '',
            }}
            css={styles.dragHandlerButton}
          >
            <MoveIcon {...(isLarge ? { width: '20', height: '20' } : {})} />
          </Button>
        )}
      </div>
      {!isDragging && (
        <div
          css={[styles.itemActions, isActive && styles.itemActive]}
          data-gallery-actions
        >
          <Checkbox
            value={selectedImages?.includes(index)}
            onChange={(v: boolean) => onSelectImage(v)}
          />
          {!selectedImages?.length && (
            <Button
              size="sm"
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
  onUpdate = () => {},
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
    <Flex direction="column" gap={8}>
      {selectedImages?.length > 0 ? (
        <Flex style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Checkbox
            value={selectedImages?.length === mediaItems?.length}
            label={`${selectedImages?.length} ${
              selectedImages?.length > 1 ? 'files' : 'file'
            } selected`}
            isPartialChecked={
              selectedImages?.length < mediaItems?.length &&
              selectedImages?.length !== 0
            }
            onChange={() => handleSelectAllImages()}
          />
          <Button
            variant="link"
            css={styles.deleteButton}
            onClick={handleDeleteSelectedImages}
          >
            {__('Delete', 'kirki-ecommerce')}
          </Button>
        </Flex>
      ) : (
        <>
          {label && (
            <Label
              text={label}
              type={error ? 'error' : ''}
              helpText={error ? error : helpText}
              style={{ minHeight: '23px' }}
            />
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
          <div css={styles.mediaGallery}>
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
              <div
                css={[styles.galleryItem, styles.remainingOverlay]}
                onClick={() => setExpanded(true)}
              >
                {fourthItem.url && (
                  <img src={fourthItem.url} alt={fourthItem.alt || ''} />
                )}
                <div css={styles.remainingOverlayText}>+{remainingCount}</div>
              </div>
            )}

            <MediaSelector onSelect={handleOnAddNewImages} multiple={true}>
              <div css={[styles.galleryItem, styles.addItem]}>
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

const styles = {
  mediaGallery: scoped({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))',
    gap: theme.spacing[3],
  }),
  galleryItem: scoped({
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
  }),
  galleryItemLarge: scoped({
    gridColumn: 'span 2',
    gridRow: 'span 2',
  }),
  itemOverlay: scoped({
    position: 'absolute',
    inset: 0,
    background: theme.colors.background.badgeDraft,
    opacity: 0,
    transition: 'opacity 0.2s ease',
    zIndex: 2,
    ...flexCenter(),
  }),
  itemActive: scoped({
    opacity: 1,
  }),
  itemActions: scoped({
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
  }),
  remainingOverlay: scoped({
    img: {
      transform: 'scale(1.05)',
    },
  }),
  remainingOverlayText: scoped({
    position: 'absolute',
    inset: 0,
    ...theme.typography.large('normal'),
    color: theme.colors.text.light,
    background: theme.colors.background.badgeDraft,
    borderRadius: 'inherit',
    ...flexCenter(),
  }),
  addItem: scoped({
    border: `2px dashed ${theme.colors.border.gallery}`,
    color: theme.colors.background.fillBrand,
    cursor: 'pointer',
    background: theme.colors.background.surfaceSecondary,
    ...flexCenter(),
    '&:hover': {
      background: theme.colors.background.galleryHover,
    },
  }),
  dragHandlerButton: scoped({
    borderRadius: theme.radius.full,
    cursor: 'grab',
    '&:active': {
      cursor: 'grabbing',
    },
  }),
  deleteButton: scoped({
    color: theme.colors.text.critical,
  }),
};
