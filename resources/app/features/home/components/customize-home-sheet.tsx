import { Settings2 } from 'lucide-react';

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
import {
  AmountFormatOptions,
  CustomizeGroupHeading,
  getMetricDefinitions,
  SortableList,
  type SortableListItem,
  useAnalyticsMetricQuery,
} from '@/features/analytics';
import type { HomeLayoutControls } from '@/features/home/hooks/use-home-layout';
import { getActionLabel, getSectionTitle } from '@/features/home/lib/labels';
import {
  getPeriodParams,
  GROUP_LIMITS,
  type HomeLayoutItem,
  isAtLimit,
} from '@/features/home/lib/layout';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const SHEET_STORAGE_KEY = 'kirki-ecommerce:home:customize-sheet';

const formatCount = (items: HomeLayoutItem<string>[], limit: number) => {
  return sprintf(
    /* translators: 1: number of items that are on, 2: most items that can be on */
    __('%1$d/%2$d', 'kirki-ecommerce'),
    items.filter((item) => item.visible).length,
    limit,
  );
};

const toListItems = <K extends string>(
  items: HomeLayoutItem<K>[],
  limit: number | null,
  getTitle: (key: K) => string,
  getNote?: (key: K) => string | undefined,
): SortableListItem<K>[] => {
  const atLimit = isAtLimit(items, limit);

  return items.map((item) => ({
    key: item.key,
    title: getTitle(item.key),
    isVisible: item.visible,
    isDisabled: !item.visible && atLimit,
    isMuted: !item.visible && atLimit,
    note: getNote?.(item.key),
  }));
};

type CustomizeHomeSheetProps = {
  layoutControls: HomeLayoutControls;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const CustomizeHomeSheet = (props: CustomizeHomeSheetProps) => {
  const { layoutControls, open, onOpenChange } = props;
  const customizeLabel = __('Customize home', 'kirki-ecommerce');
  const { layout, setVisible, move, setAmounts, reset } = layoutControls;
  const definitions = getMetricDefinitions();
  const actionLimit = GROUP_LIMITS.actions ?? layout.actions.length;
  const kpiLimit = GROUP_LIMITS.kpis ?? layout.kpis.length;
  const mainAction = layout.actions.find((item) => item.visible)?.key;
  const quickActionsTitle = __('Quick actions', 'kirki-ecommerce');
  const keyNumbersTitle = __('Key numbers', 'kirki-ecommerce');
  const sectionsTitle = __('Sections', 'kirki-ecommerce');
  const amountsTitle = __('Amounts', 'kirki-ecommerce');
  const amountExample = useAnalyticsMetricQuery('kpis', getPeriodParams(layout.period), false).data
    ?.meta.amount_example;

  return (
    <Sheet floatable={{ storageKey: SHEET_STORAGE_KEY }} open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={customizeLabel}
          cssOverride={styles.trigger}
        >
          <Settings2 size={16} aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>{customizeLabel}</SheetTitle>
        </SheetHeader>
        <div css={scoped(styles.body)}>
          <section css={scoped(styles.group)}>
            <CustomizeGroupHeading
              title={quickActionsTitle}
              info={__(
                'Buttons at the top of Home. Up to 3; the first one is the main button.',
                'kirki-ecommerce',
              )}
              count={formatCount(layout.actions, actionLimit)}
            />
            <SortableList
              label={quickActionsTitle}
              items={toListItems(layout.actions, GROUP_LIMITS.actions, getActionLabel, (key) =>
                key === mainAction ? __('Main button', 'kirki-ecommerce') : undefined,
              )}
              onToggle={(key, visible) => setVisible('actions', key, visible)}
              onMove={(from, to) => move('actions', from, to)}
            />
          </section>
          <section css={scoped(styles.group)}>
            <CustomizeGroupHeading
              title={keyNumbersTitle}
              info={__('Numbers at the top of Home, in this order. Up to 4.', 'kirki-ecommerce')}
              count={formatCount(layout.kpis, kpiLimit)}
            />
            <SortableList
              label={keyNumbersTitle}
              items={toListItems(layout.kpis, GROUP_LIMITS.kpis, (key) => definitions[key].title)}
              onToggle={(key, visible) => setVisible('kpis', key, visible)}
              onMove={(from, to) => move('kpis', from, to)}
            />
          </section>
          <section css={scoped(styles.group)}>
            <CustomizeGroupHeading
              title={sectionsTitle}
              info={__('Sections of Home, in this order.', 'kirki-ecommerce')}
            />
            <SortableList
              label={sectionsTitle}
              items={toListItems(layout.sections, GROUP_LIMITS.sections, getSectionTitle)}
              onToggle={(key, visible) => setVisible('sections', key, visible)}
              onMove={(from, to) => move('sections', from, to)}
            />
          </section>
          <section css={scoped(styles.group)}>
            <CustomizeGroupHeading
              title={amountsTitle}
              info={__('How money amounts are shown on Home.', 'kirki-ecommerce')}
            />
            <AmountFormatOptions
              label={amountsTitle}
              value={layout.amounts}
              example={amountExample}
              onChange={setAmounts}
            />
          </section>
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

CustomizeHomeSheet.displayName = 'CustomizeHomeSheet';

export default CustomizeHomeSheet;

const styles = defineStyles({
  trigger: {
    backgroundColor: theme.colors.background.surface,
  },
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
