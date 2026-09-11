import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Check, CircleSlashIcon, MoreVertical, RefreshCcw, Trash2 } from 'lucide-react';
import { useFormContext, useFormState } from 'react-hook-form';
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
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { dateFormatter } from '@/utils/common';
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
            cssOverride={{ color: theme.colors.text.critical }}
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
  const { currencyList, showApiProviderStatus, lastSyncAt, handleAction } =
    useAvailableCurrencyList();
  const { mutate: syncRates, isPending: isSyncing } = useSyncCurrencyRatesMutation();

  return (
    <Card cssOverride={{ ...cardStyles.innerCard }}>
      <CardContent cssOverride={styles.innerCardContent}>
        <Flex justify="space-between" cssOverride={{ paddingBottom: theme.spacing[3] }}>
          <Text weight="semibold">{__('Available Currencies', 'kirki-ecommerce')}</Text>
          <Button
            variant="ghost"
            loading={isSyncing}
            disabled={isSyncing}
            onClick={() => syncRates()}
          >
            <RefreshCcw size="12" />
            <Text variant="tiny"> {__('Sync Now', 'kirki-ecommerce')}</Text>
          </Button>
        </Flex>
        <StackedItems>
          {currencyList.map((item, index) => {
            const isActive = item.is_active;

            return (
              <StackedItem
                key={item.id}
                id={String(item.id)}
                cssOverride={mergeCss(!item.is_action_disabled && styles.itemRow)}
              >
                {item.symbol && <StackedItemMedia>{item.symbol}</StackedItemMedia>}
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
                  {item.is_action_disabled ? (
                    <Text variant="small" color="subdued">
                      {__('0.00', 'kirki-ecommerce')}
                    </Text>
                  ) : (
                    <>
                      <Text variant="small" color="subdued" data-right-text>
                        {item.exchange_rate || '--'}
                      </Text>
                      <CurrencyRowActions item={item} index={index} onAction={handleAction} />
                    </>
                  )}
                </StackedItemActions>
              </StackedItem>
            );
          })}
        </StackedItems>
        {showApiProviderStatus && (
          <Flex gap={2} cssOverride={{ marginTop: theme.spacing[4] }} align="center">
            <InfoCircledIcon width={16} height={16} />
            <Text variant="small" color="subdued">
              {sprintf(
                __('API connection active. Last sync: %s', 'kirki-ecommerce'),
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
  itemRow: {
    '&:hover': {
      paddingRight: 0,
    },
  },
  innerCardContent: {
    padding: theme.spacing[3],
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
