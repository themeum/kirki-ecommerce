import type { ReactNode } from 'react';

import Button from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import AmountFormatOptions from '@/features/analytics/components/amount-format-options';
import CustomizeGroupHeading from '@/features/analytics/components/customize-group-heading';
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
  info: string;
  count?: string;
  items: LayoutItem<K>[];
  getNote?: (key: K) => string | undefined;
  onToggle: (key: K, visible: boolean) => void;
  onMove: (from: number, to: number) => void;
};

const SortableGroup = <K extends KpiKey | CardKey>(props: SortableGroupProps<K>) => {
  const { heading, info, count, items, getNote, onToggle, onMove } = props;
  const definitions = getMetricDefinitions();

  return (
    <section css={scoped(styles.group)}>
      <CustomizeGroupHeading title={heading} info={info} count={count} />
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

  return (
    <section css={scoped(styles.group)}>
      <CustomizeGroupHeading
        title={heading}
        info={__('How money amounts are shown.', 'kirki-ecommerce')}
      />
      <AmountFormatOptions label={heading} value={value} example={example} onChange={onChange} />
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
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>{__('Customize analytics', 'kirki-ecommerce')}</SheetTitle>
        </SheetHeader>
        <div css={scoped(styles.body)}>
          <SortableGroup
            heading={__('Key metrics', 'kirki-ecommerce')}
            info={__(
              'Shown across the top, 4 in each row, in this order. Drag to reorder.',
              'kirki-ecommerce',
            )}
            count={sprintf(
              /* translators: 1: number of key metrics that are on, 2: number of key metrics */
              __('%1$d/%2$d', 'kirki-ecommerce'),
              visibleKpiCount,
              layout.kpis.length,
            )}
            items={layout.kpis}
            onToggle={(key, visible) => setVisible('kpis', key, visible)}
            onMove={(from, to) => move('kpis', from, to)}
          />
          <SortableGroup
            heading={__('Cards', 'kirki-ecommerce')}
            info={__('Shown in this order. Drag to reorder.', 'kirki-ecommerce')}
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
