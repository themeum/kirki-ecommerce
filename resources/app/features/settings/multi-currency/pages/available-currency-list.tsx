import { Check, CircleSlashIcon, Info, MoreVertical, RefreshCcw, Trash2 } from 'lucide-react';
import { useFormContext, useFormState } from 'react-hook-form';
import { useOutletContext } from 'react-router';

import NumberField from '@/components/form/number-field';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import InfoTooltip from '@/components/ui/info-tooltip';
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
import type { MultiCurrencySettingsFormInput } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import { useSyncCurrencyRatesMutation } from '@/features/settings/multi-currency/services/currency';
import type { SettingsOutletContext } from '@/features/settings/types';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type CurrencyRateInputProps = {
  index: number;
  code: string;
};

const CurrencyRateInput = ({ index, code }: CurrencyRateInputProps) => {
  const { control } = useFormContext<MultiCurrencySettingsFormInput>();
  const { errors } = useFormState({ control, name: `currencies.${index}.exchange_rate` });
  const error = errors.currencies?.[index]?.exchange_rate;

  return (
    <InfoTooltip infoText={error?.message} position="top" iconPosition="left" variant="critical">
      <NumberField
        name={`currencies.${index}.exchange_rate`}
        min={0}
        aria-label={sprintf(__('Exchange rate for %s', 'kirki-ecommerce'), code)}
        cssOverride={styles.rateInput}
        placeholder="1.00"
        showError={false}
      />
    </InfoTooltip>
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
        variant: 'success',
        force: true,
        title: __('Set as Base Currency', 'kirki-ecommerce'),
        subtitle:
          __(
            'Would you like to make this your primary currency? All exchange rates will be adjusted accordingly.',
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
        title: __('Delete Currency', 'kirki-ecommerce'),
        subtitle:
          __(
            'Do you really want to remove this currency? All exchange rates and transaction history will be permanently lost.',
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
          !item.is_active
            ? /* translators: %s: unsaved changes note */
              __(
                'Are you sure you want to deactivate this currency? This action cannot be undone. %s',
                'kirki-ecommerce',
              )
            : /* translators: %s: unsaved changes note */
              __(
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
          {!item.is_toggle_disabled && (
            <DropdownMenuItem onClick={handleStatus}>
              <CircleSlashIcon size="16" />
              <Text variant="small">
                {item.is_active
                  ? __('Deactivate', 'kirki-ecommerce')
                  : __('Activate', 'kirki-ecommerce')}
              </Text>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleSetBase}>
            <Check size="16" />
            <Text variant="small">{__('Set as Base Currency', 'kirki-ecommerce')}</Text>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            cssOverride={{
              color: theme.colors.text.critical,
              '& svg': { color: theme.colors.icon.critical },
            }}
          >
            <Trash2 size="16" />
            <Text variant="small">{__('Delete', 'kirki-ecommerce')}</Text>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CurrencyRateInput index={index} code={item.code} />
    </ActionGroup>
  );
};

export const AvailableCurrencyList = () => {
  const { currencyList, syncStatus, handleAction } = useAvailableCurrencyList();
  const { mutate: syncRates, isPending: isSyncing } = useSyncCurrencyRatesMutation();
  const hasMultipleCurrencies = currencyList.length > 1;

  return (
    <StackedItems
      data-search-id="currency.available-currencies"
      data-search-keywords="multi currency, usd, eur, gbp, exchange"
    >
      <StackedItem id="header" cssOverride={mergeCss(styles.staticRow, styles.headerRow)}>
        <StackedItemContent>
          <Text weight="semibold">{__('Available Currencies', 'kirki-ecommerce')}</Text>
        </StackedItemContent>
        {hasMultipleCurrencies && (
          <StackedItemActions>
            <Button
              variant="ghost"
              loading={isSyncing}
              disabled={isSyncing}
              onClick={() => syncRates()}
            >
              <RefreshCcw />
              {__('Sync now', 'kirki-ecommerce')}
            </Button>
          </StackedItemActions>
        )}
      </StackedItem>
      {currencyList.map((item, index) => {
        const isInactive = item.is_active === false;

        return (
          <StackedItem
            key={item.id}
            id={String(item.id)}
            cssOverride={mergeCss(!item.is_action_disabled && styles.itemRow)}
          >
            {item.symbol && (
              <StackedItemMedia cssOverride={styles.symbol}>
                <Text variant="small" color={isInactive ? 'subdued' : 'secondary'}>
                  {item.symbol}
                </Text>
              </StackedItemMedia>
            )}
            <StackedItemContent>
              <StackedItemTitle>
                <Text variant="small" weight="medium" color={isInactive ? 'subdued' : 'primary'}>
                  {item.code}
                </Text>
                <Text variant="small" color={isInactive ? 'subdued' : 'secondary'}>
                  {item.name}
                </Text>
                {item.is_base && <Badge>{__('Base Currency', 'kirki-ecommerce')}</Badge>}
                {isInactive && (
                  <Badge variant="destructive">{__('Inactive', 'kirki-ecommerce')}</Badge>
                )}
              </StackedItemTitle>
            </StackedItemContent>
            <StackedItemActions cssOverride={{ paddingRight: theme.spacing[3] }}>
              {item.is_base ? (
                <Text variant="small" weight="medium">
                  {__('1.00', 'kirki-ecommerce')}
                </Text>
              ) : (
                <>
                  {!isInactive && (
                    <Text variant="small" weight="medium" data-right-text>
                      {item.exchange_rate || '--'}
                    </Text>
                  )}
                  {!item.is_action_disabled && (
                    <CurrencyRowActions item={item} index={index} onAction={handleAction} />
                  )}
                </>
              )}
            </StackedItemActions>
          </StackedItem>
        );
      })}
      {hasMultipleCurrencies && (
        <StackedItem id="footer" cssOverride={mergeCss(styles.staticRow, styles.footerRow)}>
          <StackedItemMedia
            cssOverride={syncStatus.tone === 'warning' ? styles.warningIcon : styles.infoIcon}
          >
            <Info />
          </StackedItemMedia>
          <StackedItemContent>
            <Text variant="small" color={syncStatus.tone === 'warning' ? 'warning' : 'subdued'}>
              {syncStatus.message}
            </Text>
          </StackedItemContent>
        </StackedItem>
      )}
    </StackedItems>
  );
};

const styles = defineStyles({
  itemRow: {
    '&:hover': {
      paddingRight: 0,
    },
  },
  staticRow: {
    height: 'auto',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
  headerRow: {
    minHeight: '48px',
    paddingRight: theme.spacing[2],
    '& button:not([role="switch"])': {
      width: 'auto',
      paddingInline: theme.spacing[2],
      color: theme.colors.text.brand,

      '& svg': {
        color: theme.colors.icon.brand,
      },
    },
  },
  footerRow: {
    minHeight: '34px',
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[2],
  },
  symbol: {
    minWidth: '16px',
    justifyContent: 'center',
  },
  infoIcon: {
    alignSelf: 'flex-start',
    marginTop: '2px',
    color: theme.colors.icon.secondary,
    '& svg': {
      width: '16px',
      height: '16px',
    },
  },
  warningIcon: {
    alignSelf: 'flex-start',
    color: theme.colors.text.warning,
    marginTop: '2px',
    '& svg': {
      width: '16px',
      height: '16px',
    },
  },
  rateInput: {
    width: '120px',
    minHeight: '24px',
    '& input': {
      minHeight: '24px',
      textAlign: 'right',
    },
  },
});
