import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { CLASS_PREFIX } from "conf";
import { MediaSelector } from "components";
import { Button, Checkbox, Flex, Label } from "molecules";
import { MoveIcon, PlusIcon, TrashIcon } from "icons";
import { __ } from "wpi18n";
import { restrictToParentElement } from "@dnd-kit/modifiers";

const SortableItem = ({
  id,
  index,
  url,
  alt = "",
  className,
  onSelectImage = () => {},
  onDeleteImage = () => {},
  selectedImages = [],
  isLarge,
  disableDrag,
}) => {
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
    Math.abs(scaleX - 1) < ThresholdValue
      ? 1
      : scaleX > 1
      ? 0.5
      : scaleX < 1
      ? 1.5
      : scaleX;

  const normalizedScaleY =
    Math.abs(scaleY - 1) < ThresholdValue
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
      className={`${CLASS_PREFIX}-gallery-item ${className || ""}`}
      {...attributes}
    >
      <div
        className={`${CLASS_PREFIX}-gallery-item-overlay ${
          selectedImages?.includes(index) ? `${CLASS_PREFIX}-active` : ""
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
                : "",
            }}
            className={`${CLASS_PREFIX}-gallery-item-drag-handler`}
            icon={
              <MoveIcon {...(isLarge ? { width: "20", height: "20" } : {})} />
            }
          />
        )}
      </div>
      {!isDragging && (
        <div
          className={`${CLASS_PREFIX}-gallery-item-actions ${
            selectedImages?.includes(index) ? `${CLASS_PREFIX}-active` : ""
          }`}
        >
          <Checkbox
            value={selectedImages?.includes(index)}
            onChange={(v) => onSelectImage(v)}
          />
          {!selectedImages?.length > 0 && (
            <Button
              size="xsm"
              type="ghost"
              icon={<TrashIcon color="#D40000" />}
              onClick={onDeleteImage}
            />
          )}
        </div>
      )}
      {url && <img src={url} alt={alt || ""} />}
    </div>
  );
};

// --- Main Component ---
const MediaGallery = ({
  mediaItems = [],
  label = "",
  onUpdate = () => {},
  error,
  helpText,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const oldIndex = active.data.current.sortable.index;
    const newIndex = over.data.current.sortable.index;

    if (oldIndex === newIndex) return;

    const newOrder = arrayMove(mediaItems, oldIndex, newIndex);
    onUpdate?.(newOrder);
  };

  const handleOnAddNewImages = (newImages) => {
    const updatedImages = [...mediaItems, ...newImages];
    onUpdate?.(updatedImages);
  };

  const visibleItems = expanded ? mediaItems : mediaItems?.slice(0, 3);
  const remainingCount = mediaItems?.length > 3 ? mediaItems?.length - 3 : 0;
  const fourthItem = mediaItems[3] || {};

  const updateSelectedImageList = (value, currentIndex) => {
    if (value) {
      const updatedList = [...selectedImages, currentIndex];
      setSelectedImages(updatedList);
    } else {
      const filteredList = selectedImages?.filter(
        (item, index) => index !== currentIndex
      );
      setSelectedImages(filteredList);
    }
  };

  const handleSelectAllImages = () => {
    if (selectedImages?.length < mediaItems?.length) {
      const allMedia = mediaItems?.map((item, index) => index);
      setSelectedImages(allMedia);
    } else setSelectedImages([]);
  };

  const handleDeleteSelectedImages = () => {
    const filteredMediaItems = mediaItems?.filter(
      (item, index) => !selectedImages?.includes(index)
    );
    setSelectedImages([]);
    onUpdate(filteredMediaItems);
  };

  const handleDeleteSingleImage = (currentIndex) => {
    setSelectedImages((prev) =>
      prev.filter((item, index) => index !== currentIndex)
    );
    const filteredMedia = mediaItems?.filter(
      (item, index) => index !== currentIndex
    );
    onUpdate(filteredMedia);
  };

  return (
    <Flex direction="column" gap={8}>
      {selectedImages?.length > 0 ? (
        <Flex style={{ alignItems: "center", justifyContent: "space-between" }}>
          <Checkbox
            value={selectedImages?.length === mediaItems?.length}
            label={`${selectedImages?.length} ${
              selectedImages?.length > 1 ? "files" : "file"
            } selected`}
            isPartialChecked={
              selectedImages?.length < mediaItems?.length &&
              selectedImages?.length !== 0
            }
            onChange={(value) => handleSelectAllImages(value)}
          />
          <Button
            type="blank"
            text={__("Delete", "kirki-ecommerce")}
            style={{ color: "#D40000" }}
            onClick={handleDeleteSelectedImages}
          />
        </Flex>
      ) : (
        <>
          {label && (
            <Label
              text={label}
              type={error ? "error" : ""}
              helpText={error ? error : helpText}
              style={{ minHeight: "23px" }}
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
              expanded ? `${CLASS_PREFIX}-expanded` : ""
            }`}
          >
            {visibleItems.map((img, index) => {
              const isLarge = index === 0;

              return (
                <SortableItem
                  // key={img.id}
                  index={index}
                  key={`${img.id}-${index}`}
                  disableDrag={selectedImages?.length > 0}
                  id={`${img.id}-${index}`}
                  url={img.url}
                  alt={img.alt || ""}
                  isLarge={isLarge}
                  className={`${isLarge ? `${CLASS_PREFIX}-large` : ""}`}
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
                  <img src={fourthItem.url} alt={fourthItem.alt || ""} />
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
