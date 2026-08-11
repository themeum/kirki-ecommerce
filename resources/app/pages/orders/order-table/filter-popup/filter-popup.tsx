import { memo, useEffect, useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Text from '@/components/ui/text';
import { useListParams } from '@/hooks';
import { CloseIcon, ListFilter } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { OrderListFilter} from '@/types/filters/order';
import { fulfillmentStatusOptions, orderListOptions, paymentStatusOptions } from '@/types/filters/order';
import { __ } from '@/wpi18n';

const emptyFilter: OrderListFilter = {
  fulfillment_status: 'all',
  payment_status: 'all',
};

const FilterPopup = memo(() => {
  const { params, setParams } = useListParams<OrderListFilter>(orderListOptions);
  const [openPopup, setOpenPopup] = useState(false);
  const [filterObject, setFilterObject] = useState<OrderListFilter>(emptyFilter);

  const hasFilter = [
    params.fulfillment_status,
    params.payment_status,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!openPopup) {
      return;
    }
    setFilterObject({
      fulfillment_status: (params.fulfillment_status!) || 'all',
      payment_status: (params.payment_status!) || 'all',
    });
  }, [openPopup]);

  const handleOnFilterChange = (
    val: string,
    filterName: keyof OrderListFilter,
  ) => {
    setFilterObject((prev) => ({
      ...prev,
      [filterName]: val,
    }));
  };

  const handleFilterClose = () => {
    setFilterObject(emptyFilter);
    setOpenPopup(false);
  };

  const handleOnApplyFilter = () => {
    setParams({
      fulfillment_status:
        filterObject.fulfillment_status && filterObject.fulfillment_status !== 'all'
          ? filterObject.fulfillment_status
          : undefined,
      payment_status:
        filterObject.payment_status && filterObject.payment_status !== 'all'
          ? filterObject.payment_status
          : undefined,
    });
    handleFilterClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setOpenPopup(true);
    } else {
      handleFilterClose();
    }
  };

  return (
    <DropdownMenu open={openPopup} onOpenChange={handleOpenChange}>
      <Flex>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            style={{
              borderRightColor: hasFilter ? 'none' : theme.colors.border.default,
              borderRadius: hasFilter
                ? `${theme.radius.md} ${theme.radius.none} ${theme.radius.none} ${theme.radius.md}`
                : theme.radius.md,
            }}
          >
            <ListFilter />
            {__('Filter', 'kirki-ecommerce')}
          </Button>
        </DropdownMenuTrigger>
        {hasFilter ? (
          <Button
            variant="outline"
            style={{
              color: theme.colors.text.emphasis,
              backgroundColor: theme.colors.background.fillSecondary,
              borderLeft: 'none',
              cursor: 'default',
              borderRadius: `${theme.radius.none} ${theme.radius.md} ${theme.radius.md} ${theme.radius.none}`,
            }}
          >
            {hasFilter}
          </Button>
        ) : null}
      </Flex>
      <DropdownMenuContent style={{ width: '288px', maxHeight: '522px' }}>
        <Flex cssOverride={styles.header}>
          <Text>{__('Filter', 'kirki-ecommerce')}</Text>
          <ActionGroup>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFilterClose}
              cssOverride={styles.closeButton}
            >
              <CloseIcon />
            </Button>
          </ActionGroup>
        </Flex>

        <Flex direction="column" gap={4} cssOverride={styles.body}>

          <Flex direction="column" gap={2}>
            <Label>{__('Fulfillment Status', 'kirki-ecommerce')}</Label>
            <Select
              value={filterObject.fulfillment_status || undefined}
              onValueChange={(val) => handleOnFilterChange(val, 'fulfillment_status')}
            >
              <SelectTrigger>
                <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
              </SelectTrigger>
              <SelectContent>
                {
                  fulfillmentStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.title}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </Flex>

          <Flex direction="column" gap={2}>
            <Label>{__('Payment Status', 'kirki-ecommerce')}</Label>
            <Select
              value={filterObject.payment_status || undefined}
              onValueChange={(val) => handleOnFilterChange(val, 'payment_status')}
            >
              <SelectTrigger>
                <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
              </SelectTrigger>
              <SelectContent>
                {
                  paymentStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.title}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </Flex>

        </Flex>

        <Flex cssOverride={styles.footer}>
          <ActionGroup>
            <Button variant="primary" onClick={handleOnApplyFilter}>
              {__('Apply Filter', 'kirki-ecommerce')}
            </Button>
          </ActionGroup>
        </Flex>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

FilterPopup.displayName = 'FilterPopup';

export default FilterPopup;

const styles = defineStyles({
  header: {
    top: '-4px',
    position: 'sticky',
    backgroundColor: theme.colors.background.surface,
    padding: `${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[2]} ${theme.spacing[3]}`,
    zIndex: theme.zIndex.sticky,
  },
  closeButton: {
    color: theme.colors.text.primary,
  },
  body: {
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    overflowY: 'auto',
  },
  footer: {
    padding: `${theme.spacing[2]} ${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[3]}`,
    borderTop: `1px solid ${theme.colors.border.default}`,
    bottom: '-4px',
    position: 'sticky',
    backgroundColor: theme.colors.background.surface,
  },
});
