import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { css } from '@emotion/react';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import ConfirmationDialog from '@/components/modal/confirmation-dialog';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Chip from '@/components/ui/chip';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { DragIcon, EditIcon, PlusIcon, TrashIcon } from '@/icons';
import AddOrEditAttribute from '@/pages/products/product-form/sections/variants/attribute-list/add-or-edit-attribute';
import {
  type MatrixMutation,
  savedVariants,
  useVariantMatrix,
} from '@/pages/products/product-form/sections/variants/use-variant-matrix';
import type { ProductFormInput } from '@/schemas/forms/product-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, flexCenter, mergeCss, scoped, scopedMerge } from '@/theme/mixins';
import type { Attribute } from '@/types';
import { __, _n, sprintf } from '@/wpi18n';

type SortableCardProps = {
  item: Attribute;
  editingId: number | string | null;
  onClose: () => void;
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
  handleAttributeEdit,
  handleAttributeRemove,
}: SortableCardProps) => {
  const isEditing = editingId !== null;
  const [isHovered, setIsHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id, disabled: isEditing });

  const style = defineStyles({
    transform: CSS.Transform.toString(transform),
    transition,
  });

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        cssOverride={cardStyles.innerCard}
        key={item.id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent cssOverride={styles.innerContent}>
        {editingId !== item.id ? (
          <Flex gap={3}>
            <span
              {...(!isEditing ? attributes : {})}
              {...(!isEditing ? listeners : {})}
              role="button"
              css={scopedMerge(styles.svgClass, styles.dragHandler)}
              style={{
                opacity: isEditing ? 0.5 : 1,
              }}
            >
              <DragIcon />
            </span>
            <Flex direction="column" gap={2}>
              <Text weight="medium">{item?.name}</Text>
              <Flex gap={2} wrap="wrap" rowGap={3} cssOverride={{ maxWidth: '480px' }}>
                {(item?.values ?? []).map((variant, index) => (
                  <Chip
                    gap={2}
                    key={index}
                    text={variant?.value}
                    color={variant?.color ?? undefined}
                  />
                ))}
              </Flex>
            </Flex>

            <ActionGroup
              cssOverride={mergeCss(hoverVisibleCss, isHovered && hoverVisibleActiveCss)}
            >
              <Button
                variant="secondary"
                onClick={() => handleAttributeEdit(item)}
              >
                <EditIcon />
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleAttributeRemove(item.id)}
              >
                <TrashIcon />
              </Button>
            </ActionGroup>
          </Flex>
        ) : (
          <AddOrEditAttribute data={item} onClose={onClose} />
        )}
        </CardContent>
      </Card>
    </div>
  );
};

SortableCard.displayName = 'SortableCard';

const AttributeList = () => {
  const { control } = useFormContext<ProductFormInput>();
  const watchedAttributes = useWatch({ control, name: 'attributes' });
  const formAttributes = useMemo<NonNullable<typeof watchedAttributes>>(
    () => watchedAttributes ?? [],
    [watchedAttributes],
  );
  const [attributeValues, setAttributeValues] = useState<Attribute[]>([]);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<MatrixMutation | null>(
    null,
  );
  const { removeAttribute, reorderAttributes, describeDiscarded } =
    useVariantMatrix();

  useEffect(() => {
    setAttributeValues(formAttributes);
  }, [formAttributes]);

  const handleAttributeEdit = (attribute: Attribute) => {
    setEditingId(attribute?.id);
  };

  const handleAttributeRemove = (id: number) => {
    const mutation = removeAttribute(id);

    if (savedVariants(mutation.discarded).length > 0) {
      setPendingRemoval(mutation);
      return;
    }

    mutation.commit();
  };

  const handleConfirmRemoval = () => {
    pendingRemoval?.commit();
    setPendingRemoval(null);
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

      const reordered = arrayMove(attributeValues, oldIndex, newIndex);
      setAttributeValues(reordered);
      reorderAttributes(reordered).commit();
    }
  };

  const onClose = () => {
    setEditingId(null);
  };

  return (
    <>
      <Flex direction="column" gap={4}>
        {attributeValues?.length > 0 && (
          <Flex direction="column" gap={2} cssOverride={{ position: 'relative' }}>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <Flex direction="column" gap={2}>
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
      </Flex>
      {editingId === 'new' && (
        <AddOrEditAttribute onClose={onClose} />
      )}
      {!!pendingRemoval && (
        <ConfirmationDialog
          variant="delete"
          title={__('Remove variation?', 'kirki-ecommerce')}
          subtitle={sprintf(
            _n(
              '%1$d saved variation will be deleted when you save this product: %2$s',
              '%1$d saved variations will be deleted when you save this product: %2$s',
              savedVariants(pendingRemoval.discarded).length,
              'kirki-ecommerce',
            ),
            savedVariants(pendingRemoval.discarded).length,
            describeDiscarded(savedVariants(pendingRemoval.discarded)),
          )}
          onConfirm={handleConfirmRemoval}
          onCancel={() => setPendingRemoval(null)}
        />
      )}
    </>
  );
};

AttributeList.displayName = 'AttributeList';

export default AttributeList;

const styles = defineStyles({
  innerContent: {
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  },
  svgClass: scoped(flexCenter()),
  dragHandler: {
    cursor: 'grab',
    '&:active': {
      cursor: 'grabbing',
    },
  },
});
