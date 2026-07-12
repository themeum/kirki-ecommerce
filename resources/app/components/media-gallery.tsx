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
import { CLASS_PREFIX } from '@/conf';
import { MoveIcon, PlusIcon, TrashIcon } from '@/icons';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
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
  className?: string;
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
  className,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${CLASS_PREFIX}-gallery-item ${className || ''}`}
      {...attributes}
    >
      <div
        className={`${CLASS_PREFIX}-gallery-item-overlay ${
          selectedImages?.includes(index) ? `${CLASS_PREFIX}-active` : ''
        }`}
        {...listeners}
      >
        {!disableDrag && (
          <Button
            type="ghost"
            size="small"
            {...listeners}
            style={{
              transform: isDragging
                ? `scale(${normalizedScaleX}, ${normalizedScaleY})`
                : '',
            }}
            className={`${CLASS_PREFIX}-gallery-item-drag-handler`}
            icon={
              <MoveIcon {...(isLarge ? { width: '20', height: '20' } : {})} />
            }
          />
        )}
      </div>
      {!isDragging && (
        <div
          className={`${CLASS_PREFIX}-gallery-item-actions ${
            selectedImages?.includes(index) ? `${CLASS_PREFIX}-active` : ''
          }`}
        >
          <Checkbox
            value={selectedImages?.includes(index)}
            onChange={(v: boolean) => onSelectImage(v)}
          />
          {!selectedImages?.length && (
            <Button
              size="xsm"
              type="ghost"
              icon={<TrashIcon color="#D40000" />}
              onClick={onDeleteImage}
            />
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
            type="blank"
            text={__('Delete', 'kirki-ecommerce')}
            style={{ color: '#D40000' }}
            onClick={handleDeleteSelectedImages}
          />
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
          <div
            className={`${CLASS_PREFIX}-media-gallery ${
              expanded ? `${CLASS_PREFIX}-expanded` : ''
            }`}
          >
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
                  className={`${isLarge ? `${CLASS_PREFIX}-large` : ''}`}
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
                className={`${CLASS_PREFIX}-gallery-item ${CLASS_PREFIX}-overlay`}
                onClick={() => setExpanded(true)}
              >
                {fourthItem.url && (
                  <img src={fourthItem.url} alt={fourthItem.alt || ''} />
                )}
                <div className={`${CLASS_PREFIX}-overlay-text`}>
                  +{remainingCount}
                </div>
              </div>
            )}

            <MediaSelector onSelect={handleOnAddNewImages} multiple={true}>
              <div
                className={`${CLASS_PREFIX}-gallery-item ${CLASS_PREFIX}-add`}
              >
                <div className={`${CLASS_PREFIX}-add-icon`}>
                  <PlusIcon height={24} width={24} />
                </div>
              </div>
            </MediaSelector>
          </div>
        </SortableContext>
      </DndContext>
    </Flex>
  );
};

export default MediaGallery;
