import type { ReactNode } from 'react';

import Button from '@/components/ui/button';
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
import Text from '@/components/ui/text';
import SortableList from '@/features/analytics/components/sortable-list';
import {
  type AnalyticsLayoutControls,
  canHideItem,
} from '@/features/analytics/hooks/use-analytics-layout';
import { CARD_REGISTRY } from '@/features/analytics/lib/card-registry';
import type { AmountFormat, CardKey, KpiKey, LayoutItem } from '@/features/analytics/lib/layout';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import type { MoneyObject } from '@/features/analytics/schemas/catalog/analytics';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const SHEET_STORAGE_KEY = 'kirki-ecommerce:analytics:customize-sheet';

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

  return (
    <section css={scoped(styles.group)}>
      <Flex direction="column" gap={1}>
        <Text variant="heading6">{heading}</Text>
        <Text variant="small" color="subdued">
          {help}
        </Text>
      </Flex>
      <SortableList
        label={heading}
        items={items.map((item) => ({
          key: item.key,
          title: definitions[item.key].title,
          isVisible: item.visible,
          isDisabled: item.visible && !canHideItem(items, item.key),
          note: getNote?.(item.key),
        }))}
        onToggle={onToggle}
        onMove={onMove}
      />
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
    <Sheet floatable={{ storageKey: SHEET_STORAGE_KEY }}>
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
  footer: {
    justifyContent: 'space-between',
  },
});
