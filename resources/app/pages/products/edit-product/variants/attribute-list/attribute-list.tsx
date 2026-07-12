import {
  closestCenter,
  DndContext,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';

import { CLASS_PREFIX } from '@/conf';
import { DragIcon, EditIcon, PlusIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Tag from '@/molecules/tag';
import Text from '@/molecules/text';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProductAttributes } from '@/store/productSlice';
import type { Attribute } from '@/types';
import { __ } from '@/wpi18n';

import AddOrEditAttribute from './add-or-edit-attribute';

type SaveResult = {
  success?: boolean;
};

type AttributeListProps = {
  onSave?: () => Promise<SaveResult | false | void> | SaveResult | false | void;
};

type SortableCardProps = {
  item: Attribute;
  editingId: number | string | null;
  onClose: () => void;
  onSave: AttributeListProps['onSave'];
  handleAttributeEdit: (attribute: Attribute) => void;
  handleAttributeRemove: (id: number) => void;
};

const SortableCard = ({
  item,
  editingId,
  onClose,
  onSave,
  handleAttributeEdit,
  handleAttributeRemove,
}: SortableCardProps) => {
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
        style={{ padding: '12px 16px' }}
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
                  maxWidth: '480px',
                  flexWrap: 'wrap',
                  rowGap: '12px',
                }}
              >
                {(item?.values || []).map((variant, index) => (
                  <Tag
                    gap={6}
                    key={index}
                    text={variant?.value}
                    color={variant?.color ?? undefined}
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

const AttributeList = ({ onSave = () => {} }: AttributeListProps) => {
  const dispatch = useAppDispatch();
  const { data: productData } = useAppSelector((state) => state.product);
  const [attributeValues, setAttributeValues] = useState<Attribute[]>([]);
  const [editingId, setEditingId] = useState<number | string | null>(null);

  useEffect(() => {
    setAttributeValues(productData?.attributes);
  }, [productData?.attributes]);

  const handleAttributeEdit = (attribute: Attribute) => {
    setEditingId(attribute?.id);
  };

  const handleAttributeRemove = (id: number) => {
    const attributeList = attributeValues?.filter((item) => item.id !== id);
    dispatch(updateProductAttributes(attributeList));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = attributeValues?.findIndex(
        (item) => item.id === active.id,
      );
      const newIndex = attributeValues?.findIndex(
        (item) => item.id === over?.id,
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
          <Flex direction="column" gap={8} style={{ position: 'relative' }}>
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
            text={__('Add', 'kirki-ecommerce')}
            leftIcon={<PlusIcon />}
            onClick={() => setEditingId('new')}
          />
        )}
      </>
      {editingId === 'new' && (
        <AddOrEditAttribute onClose={onClose} onSave={onSave} />
      )}
    </>
  );
};

export default AttributeList;
