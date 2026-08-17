import DropdownButton from '@/components/dropdown-button';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
  useStackedItem,
} from '@/components/ui/stacked-items';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { useAvailableCurrencyList } from '@/features/settings/multi-currency/hooks/use-available-currency-list';
import type { CurrencyListItem } from '@/features/settings/multi-currency/lib/currency-list';
import AddCurrencyPopup from '@/features/settings/multi-currency/pages/add-currency-dialog';
import EditCurrencyDialog from '@/features/settings/multi-currency/pages/edit-currency-dialog';
import { InfoIcon, ShowMoreIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { dateFormatter } from '@/utils/common';
import { __, sprintf } from '@/wpi18n';

type CurrencyRowActionsProps = {
  item: CurrencyListItem;
  onToggle: (item: CurrencyListItem) => void;
  onAction: (
    action: string | number | (string | number)[],
    item: CurrencyListItem,
  ) => void;
};

const CurrencyRowActions = (props: CurrencyRowActionsProps) => {
  const { item, onToggle, onAction } = props;
  const { setOpen } = useStackedItem();

  return (
    <ActionGroup>
      {!item.is_toggle_disabled && (
        <Switch
          checked={Boolean(item.is_enabled)}
          onCheckedChange={() => onToggle(item)}
        />
      )}
      {!item.is_action_disabled && (
        <DropdownButton
          buttonProps={{
            type: 'secondary',
            style: { transform: 'rotate(90deg)' },
            icon: <ShowMoreIcon />,
            cssOverride: styles.actionButton,
          }}
          dropdownStyle={{ minWidth: '170px' }}
          size="small"
          hasLeftIcon={false}
          options={item.actionsArray ?? []}
          onOptionToggle={(value) => setOpen(value === true)}
          onOptionSelect={(action) => onAction(action, item)}
        />
      )}
    </ActionGroup>
  );
};

export const AvailableCurrencyList = () => {
  const {
    currencyList,
    showApiProviderStatus,
    lastSyncAt,
    nextSyncAt,
    editCurrency,
    setEditCurrency,
    updateData,
    handleToggleCurrencyItem,
    handleAction,
  } = useAvailableCurrencyList();

  return (
    <>
      <Card cssOverride={{ ...cardStyles.innerCard, marginTop: theme.spacing[5] }}>
        <CardContent cssOverride={styles.innerCardContent}>
          <Flex justify="space-between" cssOverride={{ paddingBottom: theme.spacing[3] }}>
            <Flex gap={2} align="center">
              <Text weight="semibold">{__('Available Currencies', 'kirki-ecommerce')}</Text>
              <Badge>
                {__('Coming Soon', 'kirki-ecommerce')}
              </Badge>
            </Flex>
            <AddCurrencyPopup />
          </Flex>
          <StackedItems>
            {currencyList.map((item) => (
              <StackedItem key={item.id} id={String(item.id)}>
                {item.icon && <StackedItemMedia>{item.icon}</StackedItemMedia>}
                <StackedItemContent>
                  <StackedItemTitle>
                    <Text variant="small" weight="medium">
                      {item.name}
                    </Text>
                    {item.is_base && (
                      <Badge variant="secondary">
                        {__('Base currency', 'kirki-ecommerce')}
                      </Badge>
                    )}
                    {item.is_enabled === false && (
                      <Badge variant="destructive">
                        {__('Inactive', 'kirki-ecommerce')}
                      </Badge>
                    )}
                  </StackedItemTitle>
                </StackedItemContent>
                <StackedItemActions>
                  <CurrencyRowActions
                    item={item}
                    onToggle={handleToggleCurrencyItem}
                    onAction={handleAction}
                  />
                </StackedItemActions>
              </StackedItem>
            ))}
          </StackedItems>
          <Flex gap={2} cssOverride={{ marginTop: theme.spacing[4] }} align="center">
            <InfoIcon />
            <Text variant="small" color="subdued">{showApiProviderStatus
              ? sprintf(
                __(
                  'API connection is active. Last sync: %s. Next update %s.',
                  'kirki-ecommerce',
                ),
                dateFormatter(lastSyncAt, 'relative'),
                dateFormatter(nextSyncAt, 'relative'),
              )
              : __('API connection is inactive', 'kirki-ecommerce')}</Text>
          </Flex>
        </CardContent>
      </Card>
      {editCurrency && (
        <EditCurrencyDialog
          editCurrency={editCurrency}
          setEditCurrency={setEditCurrency}
          handleUpdateData={(currency) => updateData({
            items: [{
              ...currency,
              is_active: currency?.is_active ?? true,
              is_base: currency?.is_base ?? false,
            }],
          })}
        />
      )}
    </>
  );
};

const styles = defineStyles({
  innerCardContent: {
    padding: theme.spacing[5],
  },
  actionButton: {
    padding: theme.spacing[1],
  },
});
