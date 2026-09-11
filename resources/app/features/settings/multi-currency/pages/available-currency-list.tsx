import { Check, CircleSlashIcon, MoreVertical, Trash2 } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useOutletContext } from 'react-router';

import NumberField from '@/components/form/number-field';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import { useAvailableCurrencyList } from '@/features/settings/multi-currency/hooks/use-available-currency-list';
import type { CurrencyListItem } from '@/features/settings/multi-currency/lib/currency-list';
import AddCurrencyPopup from '@/features/settings/multi-currency/pages/add-currency-dialog';
import type { MultiCurrencySettingsFormInput } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import { InfoIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { dateFormatter } from '@/utils/common';
import { __, sprintf } from '@/wpi18n';

type SettingsOutletContext = {
  confirmAction: (opts: { action: () => void; otherProps?: Record<string, unknown> }) => void;
};

type CurrencyRateInputProps = {
  index: number;
  code: string;
};

const CurrencyRateInput = (props: CurrencyRateInputProps) => {
  const { index, code } = props;

  return (
    <NumberField
      name={`currencies.${index}.exchange_rate`}
      min={0}
      aria-label={sprintf(__('Exchange rate for %s', 'kirki-ecommerce'), code)}
      cssOverride={styles.rateInput}
      inputCssOverride={{ minHeight: '24px' }}
    />
  );
};

type CurrencyRowActionsProps = {
  item: CurrencyListItem;
  index: number;
  onAction: (action: 'delete' | 'status' | 'set_base', item: CurrencyListItem) => void;
};

const CurrencyRowActions = (props: CurrencyRowActionsProps) => {
  const { item, index, onAction } = props;
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const { formState } = useFormContext<MultiCurrencySettingsFormInput>();

  if (item.is_action_disabled) {
    return null;
  }

  const unsavedChangesNote = formState.isDirty
    ? ` ${__('Unsaved currency changes will be discarded.', 'kirki-ecommerce')}`
    : '';

  const handleSetBase = () => {
    confirmAction({
      action: () => onAction('set_base', item),
      otherProps: {
        variant: 'warning',
        force: true,
        title: __('Set as default currency?', 'kirki-ecommerce'),
        subtitle:
          __(
            'This currency becomes the base for all exchange rates and the previous default is demoted.',
            'kirki-ecommerce',
          ) + unsavedChangesNote,
      },
    });
  };

  const handleDelete = () => {
    confirmAction({
      action: () => onAction('delete', item),
      otherProps: {
        variant: 'delete',
        force: true,
        title: __('Delete currency?', 'kirki-ecommerce'),
        subtitle:
          __(
            'Are you sure you want to delete this currency? This action cannot be undone.',
            'kirki-ecommerce',
          ) + unsavedChangesNote,
      },
    });
  };

  const handleStatus = () => {
    confirmAction({
      action: () => onAction('status', item),
      otherProps: {
        variant: 'warning',
        force: true,
        title: !item.is_active
          ? __('Activate currency?', 'kirki-ecommerce')
          : __('Deactivate currency?', 'kirki-ecommerce'),
        subtitle: sprintf(
          /* translators: %s: unsaved changes note */
          !item.is_active
            ? __(
                'Are you sure you want to deactivate this currency? This action cannot be undone. %s',
                'kirki-ecommerce',
              )
            : __(
                'Are you sure you want to activate this currency? This action cannot be undone. %s',
                'kirki-ecommerce',
              ),
          unsavedChangesNote,
        ),
      },
    });
  };

  return (
    <ActionGroup>
      <Flex gap={1} cssOverride={{ alignItems: 'center' }}>
        {item.is_base ? (
          <Text variant="small" color="subdued">
            {__('1.00', 'kirki-ecommerce')}
          </Text>
        ) : (
          index >= 0 && <CurrencyRateInput index={index} code={item.code} />
        )}
      </Flex>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            cssOverride={{ '& svg': { width: 16, height: 16 } }}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {!item.is_toggle_disabled && index >= 0 && (
            <DropdownMenuItem onClick={handleStatus}>
              <CircleSlashIcon size="16" />
              <Text variant="small">{item.is_active ? __('Deactivate', 'kirki-ecommerce') : __('Activate', 'kirki-ecommerce')}</Text>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleSetBase}>
            <Check size="16" />
            <Text variant="small">{__('Set as Base Currency', 'kirki-ecommerce')}</Text>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            cssOverride={{ color: theme.colors.text.critical }}
          >
            <Trash2 size="16" />
            <Text variant="small">{__('Delete', 'kirki-ecommerce')}</Text>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ActionGroup>
  );
};

export const AvailableCurrencyList = () => {
  const { currencyList, baseCurrencyCode, showApiProviderStatus, lastSyncAt, handleAction } =
    useAvailableCurrencyList();

  const { control } = useFormContext<MultiCurrencySettingsFormInput>();
  const currencies = useWatch({ control, name: 'currencies' }) ?? [];

  return (
    <Card cssOverride={{ ...cardStyles.innerCard, marginTop: theme.spacing[5] }}>
      <CardContent cssOverride={styles.innerCardContent}>
        <Flex justify="space-between" cssOverride={{ paddingBottom: theme.spacing[3] }}>
          <Flex direction="column" gap={1}>
            <Text weight="semibold">{__('Available Currencies', 'kirki-ecommerce')}</Text>
            {baseCurrencyCode && (
              <Text variant="small" color="subdued">
                {sprintf(
                  __('Exchange rates are shown per 1.00 %s', 'kirki-ecommerce'),
                  baseCurrencyCode,
                )}
              </Text>
            )}
          </Flex>
          <AddCurrencyPopup />
        </Flex>
        <StackedItems>
          {currencyList.map((item) => {
            const fieldIndex = currencies.findIndex((currency) => currency.id === item.id);
            const isActive = fieldIndex >= 0 ? currencies[fieldIndex]?.is_active : item.is_enabled;

            return (
              <StackedItem key={item.id} id={String(item.id)}>
                {item.icon && <StackedItemMedia>{item.icon}</StackedItemMedia>}
                <StackedItemContent>
                  <StackedItemTitle>
                    <Text variant="small" weight="medium">
                      {item.name}
                    </Text>
                    {item.is_base && (
                      <Badge variant="secondary">{__('Base currency', 'kirki-ecommerce')}</Badge>
                    )}
                    {isActive === false && (
                      <Badge variant="destructive">{__('Inactive', 'kirki-ecommerce')}</Badge>
                    )}
                  </StackedItemTitle>
                </StackedItemContent>
                <StackedItemActions>
                  <CurrencyRowActions item={item} index={fieldIndex} onAction={handleAction} />
                </StackedItemActions>
              </StackedItem>
            );
          })}
        </StackedItems>
        {showApiProviderStatus && (
          <Flex gap={2} cssOverride={{ marginTop: theme.spacing[4] }} align="center">
            <InfoIcon />
            <Text variant="small" color="subdued">
              {sprintf(
                __('Last synced: %s', 'kirki-ecommerce'),
                dateFormatter(lastSyncAt, 'relative'),
              )}
            </Text>
          </Flex>
        )}
      </CardContent>
    </Card>
  );
};

const styles = defineStyles({
  innerCardContent: {
    padding: theme.spacing[5],
  },
  rateInput: {
    width: '96px',
    minHeight: '24px',
  },
});
