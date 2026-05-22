import { CLASS_PREFIX } from "@/conf";
import { DragIcon, EditIcon, PlusIcon, TrashIcon } from "@/icons";
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Tag from '@/molecules/tag';
import Text from '@/molecules/text';
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProductAttributes } from "../../../../../store/productSlice";
import { __ } from "@/wpi18n";
import AddOrEditAttribute from './add-or-edit-attribute';
import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";

const SortableCard = ({
  item,
  editingId,
  onClose,
  onSave,
  handleAttributeEdit,
  handleAttributeRemove,
}) => {
  const isEditing = editingId !== null;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        type="inner"
        style={{ padding: "12px 16px" }}
        key={item.id}
        className={`${CLASS_PREFIX}-hover-parent`}
      >
        {editingId !== item.id ? (
          <Flex gap={12}>
            <span
              {...(!isEditing ? attributes : {})}
              {...(!isEditing ? listeners : {})}
              role="button"
              className={`${CLASS_PREFIX}-svg-class ${CLASS_PREFIX}-drag-handler`}
              style={{
                opacity: isEditing ? 0.5 : 1,
              }}
            >
              <DragIcon />
            </span>
            <Flex direction="column" gap={8}>
              <Text type="secondary" header={item?.name} />
              <Flex
                gap={8}
                style={{
                  maxWidth: "480px",
                  flexWrap: "wrap",
                  rowGap: "12px",
                }}
              >
                {(item?.values || []).map((variant, index) => (
                  <Tag
                    gap={6}
                    key={index}
                    text={variant?.value}
                    color={variant?.color}
                  />
                ))}
              </Flex>
            </Flex>

            <ActionGroup className={`${CLASS_PREFIX}-hover-visible`}>
              <Button
                type="secondary"
                icon={<EditIcon />}
                onClick={() => handleAttributeEdit(item)}
                size="small"
              />
              <Button
                type="secondary"
                icon={<TrashIcon />}
                onClick={() => handleAttributeRemove(item.id)}
                size="small"
              />
            </ActionGroup>
          </Flex>
        ) : (
          <AddOrEditAttribute data={item} onClose={onClose} onSave={onSave} />
        )}
      </Card>
    </div>
  );
};

const AttributeList = ({ onSave = () => {} }) => {
  const dispatch = useDispatch();
  const { data: productData } = useSelector((state) => state.product);
  const [attributeValues, setAttributeValues] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setAttributeValues(productData?.attributes);
  }, [productData?.attributes]);

  const handleAttributeEdit = (attribute) => {
    setEditingId(attribute?.id);
  };

  const handleAttributeRemove = (id) => {
    const attributeList = attributeValues?.filter((item) => item.id !== id);
    dispatch(updateProductAttributes(attributeList));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = attributeValues?.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = attributeValues?.findIndex(
        (item) => item.id === over.id
      );

      setAttributeValues((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const onClose = () => {
    setEditingId(null);
  };

  return (
    <>
      <>
        {attributeValues?.length > 0 && (
          <Flex direction="column" gap={8} style={{ position: "relative" }}>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <Flex direction="column" gap={8}>
                <SortableContext
                  items={attributeValues?.map((item) => item?.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {attributeValues?.map((item) => (
                    <SortableCard
                      key={item.id}
                      item={item}
                      editingId={editingId}
                      handleAttributeEdit={handleAttributeEdit}
                      handleAttributeRemove={handleAttributeRemove}
                      onClose={onClose}
                      onSave={onSave}
                    />
                  ))}
                </SortableContext>
              </Flex>
            </DndContext>
          </Flex>
        )}
        {!editingId && (
          <Button
            type="primary"
            text={__("Add", "kirki-ecommerce")}
            leftIcon={<PlusIcon color="currentColor" />}
            onClick={() => setEditingId("new")}
          />
        )}
      </>
      {editingId === "new" && (
        <AddOrEditAttribute onClose={onClose} onSave={onSave} />
      )}
    </>
  );
};

export default AttributeList;
