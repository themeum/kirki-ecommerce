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
import { type ReactNode, useRef } from 'react';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { StackedItem, StackedItems } from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import {
  type AnalyticsLayoutControls,
  canHideItem,
} from '@/features/analytics/hooks/use-analytics-layout';
import { CARD_REGISTRY } from '@/features/analytics/lib/card-registry';
import type { AmountFormat, CardKey, KpiKey, LayoutItem } from '@/features/analytics/lib/layout';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import type { MoneyObject } from '@/features/analytics/schemas/catalog/analytics';
import { theme } from '@/theme';
import { defineStyles, scoped, uiFocusRing } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type SortableRowProps = {
  id: string;
  title: string;
  isVisible: boolean;
  isLocked: boolean;
  note?: string;
  onToggle: (visible: boolean) => void;
};

const SortableRow = (props: SortableRowProps) => {
  const { id, title, isVisible, isLocked, note, onToggle } = props;
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
        disabled={isVisible && isLocked}
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

type SortableGroupProps<K extends KpiKey | CardKey> = {
  heading: string;
  help: string;
  items: LayoutItem<K>[];
  getNote?: (key: K) => string | undefined;
  onToggle: (key: K, visible: boolean) => void;
  onMove: (from: number, to: number) => void;
};

const SortableGroup = <K extends KpiKey | CardKey>(props: SortableGroupProps<K>) => {
  const { heading, help, items, getNote, onToggle, onMove } = props;
  const definitions = getMetricDefinitions();
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
    <section css={scoped(styles.group)}>
      <Flex direction="column" gap={1}>
        <Text variant="heading6">{heading}</Text>
        <Text variant="small" color="subdued">
          {help}
        </Text>
      </Flex>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToList]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.key)}
          strategy={verticalListSortingStrategy}
        >
          <StackedItems ref={listRef} variant="card" aria-label={heading}>
            {items.map((item) => (
              <SortableRow
                key={item.key}
                id={item.key}
                title={definitions[item.key].title}
                isVisible={item.visible}
                isLocked={!canHideItem(items, item.key)}
                note={getNote?.(item.key)}
                onToggle={(visible) => onToggle(item.key, visible)}
              />
            ))}
          </StackedItems>
        </SortableContext>
      </DndContext>
    </section>
  );
};

SortableGroup.displayName = 'SortableGroup';

type AmountsGroupProps = {
  value: AmountFormat;
  example?: MoneyObject | null;
  onChange: (value: AmountFormat) => void;
};

const AmountsGroup = (props: AmountsGroupProps) => {
  const { value, example, onChange } = props;
  const heading = __('Amounts', 'kirki-ecommerce');
  const options: { value: AmountFormat; label: string; example?: string }[] = [
    { value: 'short', label: __('Short', 'kirki-ecommerce'), example: example?.short_display },
    { value: 'long', label: __('Long', 'kirki-ecommerce'), example: example?.display },
  ];

  return (
    <section css={scoped(styles.group)}>
      <Flex direction="column" gap={1}>
        <Text variant="heading6">{heading}</Text>
        <Text variant="small" color="subdued">
          {__('How money amounts are shown.', 'kirki-ecommerce')}
        </Text>
      </Flex>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(next as AmountFormat)}
        aria-label={heading}
      >
        {options.map((option) => (
          <Flex key={option.value} align="center" gap={2}>
            <RadioGroupItem value={option.value} id={`analytics-amounts-${option.value}`} />
            <Label htmlFor={`analytics-amounts-${option.value}`}>
              {option.example
                ? sprintf(
                    /* translators: 1: amount format name, 2: example amount in that format */
                    __('%1$s (%2$s)', 'kirki-ecommerce'),
                    option.label,
                    option.example,
                  )
                : option.label}
            </Label>
          </Flex>
        ))}
      </RadioGroup>
    </section>
  );
};

AmountsGroup.displayName = 'AmountsGroup';

type CustomizeSheetProps = {
  layoutControls: AnalyticsLayoutControls;
  amountExample?: MoneyObject | null;
  children: ReactNode;
};

const CustomizeSheet = (props: CustomizeSheetProps) => {
  const { layoutControls, amountExample, children } = props;
  const { layout, setVisible, move, setAmounts, reset } = layoutControls;
  const visibleKpiCount = layout.kpis.filter((item) => item.visible).length;

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{__('Customize analytics', 'kirki-ecommerce')}</SheetTitle>
          <SheetDescription>
            {__('Choose what the Analytics page shows, and in which order.', 'kirki-ecommerce')}
          </SheetDescription>
        </SheetHeader>
        <div css={scoped(styles.body)}>
          <SortableGroup
            heading={__('Key metrics', 'kirki-ecommerce')}
            help={sprintf(
              /* translators: 1: number of key metrics that are on, 2: number of key metrics */
              __(
                'Shown across the top, 4 in each row, in this order. %1$d/%2$d on. Drag to reorder.',
                'kirki-ecommerce',
              ),
              visibleKpiCount,
              layout.kpis.length,
            )}
            items={layout.kpis}
            onToggle={(key, visible) => setVisible('kpis', key, visible)}
            onMove={(from, to) => move('kpis', from, to)}
          />
          <SortableGroup
            heading={__('Cards', 'kirki-ecommerce')}
            help={__('Shown in this order. Drag to reorder.', 'kirki-ecommerce')}
            items={layout.cards}
            getNote={(key) =>
              CARD_REGISTRY[key].size === 'full' ? __('Full width', 'kirki-ecommerce') : undefined
            }
            onToggle={(key, visible) => setVisible('cards', key, visible)}
            onMove={(from, to) => move('cards', from, to)}
          />
          <AmountsGroup value={layout.amounts} example={amountExample} onChange={setAmounts} />
        </div>
        <SheetFooter cssOverride={styles.footer}>
          <Button variant="link" onClick={reset}>
            {__('Reset to default', 'kirki-ecommerce')}
          </Button>
          <SheetClose asChild>
            <Button variant="primary">{__('Done', 'kirki-ecommerce')}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

CustomizeSheet.displayName = 'CustomizeSheet';

export default CustomizeSheet;

const styles = defineStyles({
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[6],
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
    padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
  },
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
  footer: {
    justifyContent: 'space-between',
  },
});
