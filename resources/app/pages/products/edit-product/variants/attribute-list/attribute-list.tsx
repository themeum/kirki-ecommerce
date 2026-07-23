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
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DragIcon, EditIcon, PlusIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Tag from '@/components/ui/tag';
import Text from '@/components/ui/text';
import { useProductForm } from '@/contexts/product-form-context';
import { flexCenter, scoped } from '@/theme/mixins';
import type { Attribute } from '@/types';
import { __ } from '@/wpi18n';

import AddOrEditAttribute from '@/pages/products/edit-product/variants/attribute-list/add-or-edit-attribute';

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

const hoverVisibleCss = css({
  visibility: 'hidden',
});

const hoverVisibleActiveCss = css({
  visibility: 'visible',
});

const SortableCard = ({
  item,
  editingId,
  onClose,
  onSave,
  handleAttributeEdit,
  handleAttributeRemove,
}: SortableCardProps) => {
  const isEditing = editingId !== null;
  const [isHovered, setIsHovered] = useState(false);
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {editingId !== item.id ? (
          <Flex gap={12}>
            <span
              {...(!isEditing ? attributes : {})}
              {...(!isEditing ? listeners : {})}
              role="button"
              css={[styles.svgClass, styles.dragHandler]}
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

            <ActionGroup
              css={css(hoverVisibleCss, isHovered && hoverVisibleActiveCss)}
            >
              <Button
                variant="secondary"
                onClick={() => handleAttributeEdit(item)}
                size="sm"
              >
                <EditIcon />
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleAttributeRemove(item.id)}
                size="sm"
              >
                <TrashIcon />
              </Button>
            </ActionGroup>
          </Flex>
        ) : (
          <AddOrEditAttribute data={item} onClose={onClose} onSave={onSave} />
        )}
      </Card>
    </div>
  );
};

SortableCard.displayName = 'SortableCard';

const AttributeList = ({ onSave = () => {} }: AttributeListProps) => {
  const { product: productData, updateProductAttributes } = useProductForm();
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
    updateProductAttributes(attributeList);
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
          <Button variant="primary" onClick={() => setEditingId('new')}>
            <PlusIcon />
            {__('Add', 'kirki-ecommerce')}
          </Button>
        )}
      </>
      {editingId === 'new' && (
        <AddOrEditAttribute onClose={onClose} onSave={onSave} />
      )}
    </>
  );
};

AttributeList.displayName = 'AttributeList';

export default AttributeList;

const styles = {
  svgClass: scoped(flexCenter()),
  dragHandler: scoped({
    cursor: 'grab',
    '&:active': {
      cursor: 'grabbing',
    },
  }),
};
