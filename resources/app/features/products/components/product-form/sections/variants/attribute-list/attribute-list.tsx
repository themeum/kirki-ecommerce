import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { Edit, Trash2 } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import ConfirmationDialog from '@/components/modal/confirmation-dialog';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Chip from '@/components/ui/chip';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import AddOrEditAttribute from '@/features/products/components/product-form/sections/variants/attribute-list/add-or-edit-attribute';
import AttributePresets from '@/features/products/components/product-form/sections/variants/attribute-list/attribute-presets';
import {
  type MatrixMutation,
  savedVariants,
  useVariantMatrix,
} from '@/features/products/components/product-form/sections/variants/use-variant-matrix';
import { selectAttributePresets } from '@/features/products/lib/attribute-presets';
import type { Attribute } from '@/features/products/schemas/catalog/attribute';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { useAttributesQuery } from '@/features/products/services/attribute';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, flexCenter, mergeCss, scoped, scopedMerge } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

type Editing = { kind: 'applied'; id: number } | { kind: 'draft'; source: Attribute | null } | null;

type SortableCardProps = {
  item: Attribute;
  isEditing: boolean;
  editor: ReactNode;
  isLocked: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

const SortableCard = ({
  item,
  isEditing,
  editor,
  isLocked,
  onEdit,
  onRemove,
}: SortableCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    disabled: isLocked,
  });

  const style = defineStyles({
    transform: CSS.Transform.toString(transform),
    transition,
  });

  return (
    <div ref={setNodeRef} style={style}>
      {isEditing ? (
        editor
      ) : (
        <Card cssOverride={mergeCss(cardStyles.innerCard, styles.card)}>
          <CardContent cssOverride={styles.innerContent}>
            <Flex gap={3} align="center">
              <span
                {...(!isLocked ? attributes : {})}
                {...(!isLocked ? listeners : {})}
                role="button"
                aria-label={__('Reorder variation', 'kirki-ecommerce')}
                css={scopedMerge(styles.svgClass, styles.dragHandler, {
                  opacity: isLocked ? 0.5 : 1,
                })}
              >
                <DragHandleDots2Icon />
              </span>
              <Flex direction="column" gap={2}>
                <Text weight="medium">{item.name}</Text>
                <Flex gap={2} wrap="wrap" rowGap={3} cssOverride={{ maxWidth: '480px' }}>
                  {(item.values ?? []).map((value) => (
                    <Chip
                      gap={2}
                      key={value.id}
                      text={value.value}
                      color={value.color ?? undefined}
                    />
                  ))}
                </Flex>
              </Flex>
              <ActionGroup>
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={isLocked}
                  aria-label={sprintf(__('Edit %s', 'kirki-ecommerce'), item.name)}
                  onClick={onEdit}
                >
                  <Edit />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={isLocked}
                  aria-label={sprintf(__('Delete %s', 'kirki-ecommerce'), item.name)}
                  onClick={onRemove}
                >
                  <Trash2 />
                </Button>
              </ActionGroup>
            </Flex>
          </CardContent>
        </Card>
      )}
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
  const { data: storeAttributes } = useAttributesQuery({ limit: -1 });
  const allAttributes = useMemo(() => storeAttributes ?? [], [storeAttributes]);
  const [orderedAttributes, setOrderedAttributes] = useState<Attribute[]>([]);
  const [editing, setEditing] = useState<Editing>(null);
  const [pendingRemoval, setPendingRemoval] = useState<MatrixMutation | null>(null);
  const { removeAttribute, reorderAttributes, describeDiscarded } = useVariantMatrix();

  useEffect(() => {
    setOrderedAttributes(formAttributes);
  }, [formAttributes]);

  const draftSourceId = editing?.kind === 'draft' ? editing.source?.id : undefined;
  const { presets, overflow } = selectAttributePresets(allAttributes, [
    ...formAttributes.map((item) => item.id),
    ...(draftSourceId !== undefined ? [draftSourceId] : []),
  ]);

  const findStoreAttribute = (id: number) =>
    allAttributes.find((attribute) => attribute.id === id) ?? null;

  const closeEditor = () => setEditing(null);

  const handleAttributeRemove = (id: number) => {
    const mutation = removeAttribute(id);

    if (savedVariants(mutation.discarded).length > 0) {
      setPendingRemoval(mutation);
      return;
    }

    mutation.commit();
    closeEditor();
  };

  const handleConfirmRemoval = () => {
    pendingRemoval?.commit();
    setPendingRemoval(null);
    closeEditor();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = orderedAttributes.findIndex((item) => item.id === active.id);
      const newIndex = orderedAttributes.findIndex((item) => item.id === over?.id);

      const reordered = arrayMove(orderedAttributes, oldIndex, newIndex);
      setOrderedAttributes(reordered);
      reorderAttributes(reordered).commit();
    }
  };

  const pendingCount = pendingRemoval ? savedVariants(pendingRemoval.discarded).length : 0;

  return (
    <>
      <Flex direction="column" gap={4}>
        {orderedAttributes.length > 0 && (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <Flex direction="column" gap={2} cssOverride={{ position: 'relative' }}>
              <SortableContext
                items={orderedAttributes.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {orderedAttributes.map((item) => (
                  <SortableCard
                    key={item.id}
                    item={item}
                    isLocked={editing !== null}
                    isEditing={editing?.kind === 'applied' && editing.id === item.id}
                    editor={
                      <AddOrEditAttribute
                        attributes={allAttributes}
                        source={findStoreAttribute(item.id)}
                        applied={item}
                        onClose={closeEditor}
                        onDelete={() => handleAttributeRemove(item.id)}
                      />
                    }
                    onEdit={() => setEditing({ kind: 'applied', id: item.id })}
                    onRemove={() => handleAttributeRemove(item.id)}
                  />
                ))}
              </SortableContext>
            </Flex>
          </DndContext>
        )}
        {editing?.kind === 'draft' && (
          <AddOrEditAttribute
            attributes={allAttributes}
            source={editing.source}
            onClose={closeEditor}
          />
        )}
        <AttributePresets
          presets={presets}
          overflow={overflow}
          disabled={editing !== null}
          onPick={(attribute) => setEditing({ kind: 'draft', source: attribute })}
          onAddNew={() => setEditing({ kind: 'draft', source: null })}
        />
      </Flex>
      {!!pendingRemoval && (
        <ConfirmationDialog
          variant="delete"
          title={__('Remove variation?', 'kirki-ecommerce')}
          subtitle={sprintf(
            _n(
              '%1$d saved variation will be deleted when you save this product: %2$s',
              '%1$d saved variations will be deleted when you save this product: %2$s',
              pendingCount,
              'kirki-ecommerce',
            ),
            pendingCount,
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
    padding: theme.spacing[4],
  },
  svgClass: scoped(flexCenter()),
  dragHandler: {
    cursor: 'grab',
    '&:active': {
      cursor: 'grabbing',
    },
  },
  card: {
    '& [data-action-group]': {
      visibility: 'hidden',
    },
    '&:hover, &:focus-within': {
      '& [data-action-group]': {
        visibility: 'visible',
      },
    },
  },
});
