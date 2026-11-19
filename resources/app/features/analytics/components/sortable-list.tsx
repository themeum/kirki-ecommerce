import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { useRef } from 'react';

import Checkbox from '@/components/ui/checkbox';
import { StackedItem, StackedItems } from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, scoped, uiFocusRing } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type SortableListItem<K extends string> = {
  key: K;
  title: string;
  isVisible: boolean;
  isDisabled: boolean;
  isMuted?: boolean;
  note?: string;
};

type SortableRowProps = {
  id: string;
  title: string;
  isVisible: boolean;
  isDisabled: boolean;
  isMuted?: boolean;
  note?: string;
  onToggle: (visible: boolean) => void;
};

const SortableRow = (props: SortableRowProps) => {
  const { id, title, isVisible, isDisabled, isMuted, note, onToggle } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <StackedItem
      ref={setNodeRef}
      id={id}
      data-testid={`customize-item-${id}`}
      data-dragging={isDragging ? 'true' : undefined}
      data-muted={isMuted ? 'true' : undefined}
      cssOverride={styles.row}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        css={scoped(styles.handle)}
        {...attributes}
        {...listeners}
        aria-label={sprintf(
          /* translators: %s: title of a key metric or card */
          __('Reorder %s', 'kirki-ecommerce'),
          title,
        )}
      >
        <DragHandleDots2Icon aria-hidden="true" />
      </button>
      <Checkbox
        label={title}
        checked={isVisible}
        disabled={isDisabled}
        onChange={onToggle}
        cssOverride={styles.checkbox}
      />
      {note && (
        <Text variant="small" color="subdued" cssOverride={styles.note}>
          {note}
        </Text>
      )}
    </StackedItem>
  );
};

SortableRow.displayName = 'SortableRow';

type SortableListProps<K extends string> = {
  label: string;
  items: SortableListItem<K>[];
  onToggle: (key: K, visible: boolean) => void;
  onMove: (from: number, to: number) => void;
};

const SortableList = <K extends string>(props: SortableListProps<K>) => {
  const { label, items, onToggle, onMove } = props;
  const listRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const restrictToList: Modifier = ({ transform, draggingNodeRect }) => {
    const listRect = listRef.current?.getBoundingClientRect();

    if (!listRect || !draggingNodeRect) {
      return transform;
    }

    const minY = listRect.top - draggingNodeRect.top;
    const maxY = listRect.bottom - draggingNodeRect.bottom;

    return { ...transform, y: Math.min(Math.max(transform.y, minY), maxY) };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const from = items.findIndex((item) => item.key === active.id);
    const to = items.findIndex((item) => item.key === over.id);

    if (from === -1 || to === -1) {
      return;
    }

    onMove(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToList]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((item) => item.key)} strategy={verticalListSortingStrategy}>
        <StackedItems
          ref={listRef}
          variant="card"
          aria-label={label}
          cssOverride={{ borderRadius: theme.radius.md }}
        >
          {items.map((item) => (
            <SortableRow
              key={item.key}
              id={item.key}
              title={item.title}
              isVisible={item.isVisible}
              isDisabled={item.isDisabled}
              isMuted={item.isMuted}
              note={item.note}
              onToggle={(visible) => onToggle(item.key, visible)}
            />
          ))}
        </StackedItems>
      </SortableContext>
    </DndContext>
  );
};

SortableList.displayName = 'SortableList';

export default SortableList;
export type { SortableListItem };

const styles = defineStyles({
  row: {
    gap: theme.spacing[1],
    paddingLeft: theme.spacing[1],
    height: '40px',
    paddingRight: theme.spacing[3],
    '& button[role="checkbox"]': {
      width: '16px',
      height: '16px',
      '& svg': {
        width: '12px',
        height: '12px',
        color: theme.colors.icon.inverse,
      },
    },
    '&[data-dragging="true"]': {
      zIndex: 1,
      boxShadow: theme.shadow.lg,
    },
    '&[data-muted="true"] label': {
      color: theme.colors.text.secondary,
    },
  },
  handle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '24px',
    height: '24px',
    padding: 0,
    border: 'none',
    borderRadius: theme.radius.sm,
    background: 'transparent',
    color: theme.colors.icon.secondary,
    cursor: 'grab',
    touchAction: 'none',
    '&:focus-visible': {
      ...uiFocusRing(theme),
    },
  },
  checkbox: {
    flex: '1 1 auto',
    minWidth: 0,
  },
  note: {
    flexShrink: 0,
    marginLeft: 'auto',
  },
});
