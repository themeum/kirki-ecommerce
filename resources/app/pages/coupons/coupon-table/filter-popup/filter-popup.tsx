import { type ComponentProps, memo, useEffect, useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Text from '@/components/ui/text';
import type { CouponListFilter} from '@/features/coupons';
import { couponListOptions, discountTypeOptions, methodOptions, statusOptions } from '@/features/coupons';
import { useListParams } from '@/hooks';
import { CloseIcon, ListFilter } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { __, sprintf } from '@/wpi18n';


type FilterPopupProps = {
  onChange?: () => void;
  buttonProps?: ComponentProps<typeof Button>;
  data?: unknown;
};

const FilterPopup = memo(({
  onChange: _onChange = noop,
  buttonProps,
  data: _data,
}: FilterPopupProps) => {
  const { params, setParams } = useListParams<CouponListFilter>(couponListOptions);
  const [openPopup, setOpenPopup] = useState(false);
  const [filterObject, setFilterObject] = useState<CouponListFilter>({
    status: 'all',
    discount_type: 'all',
    method: 'all',
  });

  const hasFilter = [
    params.status,
    params.discount_type,
    params.method,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!openPopup) {
      return;
    }
    setFilterObject({
      status: (params.status!) || 'all',
      discount_type: (params.discount_type!) || 'all',
      method: (params.method!) || 'all',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seeds the draft filters from the URL params only as the popup opens; tracking params.* would overwrite the user edits as they change each control
  }, [openPopup]);

  const handleOnFilterChange = (
    val: string,
    filterName: keyof CouponListFilter,
  ) => {
    setFilterObject((prev) => ({
      ...prev,
      [filterName]: val,
    }));
  };

  const handleOnApplyFilter = () => {
    setParams({
      status:
        filterObject.status && filterObject.status !== 'all'
          ? filterObject.status
          : undefined,
      discount_type:
        filterObject.discount_type && filterObject.discount_type !== 'all'
          ? filterObject.discount_type
          : undefined,
      method:
        filterObject.method && filterObject.method !== 'all'
          ? filterObject.method
          : undefined,
    });
    handleFilterClose();
  };

  const handleFilterClose = () => {
    setFilterObject({
      status: 'all',
      discount_type: 'all',
      method: 'all',
    });
    setOpenPopup(false);
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
            {...buttonProps}
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
            {sprintf(__('%d', 'kirki-ecommerce'), hasFilter)}
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

        <Flex direction="column" gap={4} cssOverride={{ padding: `${theme.spacing[2]} ${theme.spacing[3]}`, overflowY: 'auto', minHeight: '264px' }}>

          <Flex direction="column" gap={2}>
            <Label>{__('Status', 'kirki-ecommerce')}</Label>
            <Select
              value={filterObject.status || undefined}
              onValueChange={(val) => handleOnFilterChange(val, 'status')}
            >
              <SelectTrigger>
                <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
              </SelectTrigger>
              <SelectContent>
                {
                  statusOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.title}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </Flex>

          <Flex direction="column" gap={2}>
            <Label>{__('Method', 'kirki-ecommerce')}</Label>
            <Select
              value={filterObject.method || undefined}
              onValueChange={(val) => handleOnFilterChange(val, 'method')}
            >
              <SelectTrigger>
                <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
              </SelectTrigger>
              <SelectContent>
                {
                  methodOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.title}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </Flex>

          <Flex direction="column" gap={2}>
            <Label>{__('Type', 'kirki-ecommerce')}</Label>
            <Select
              value={filterObject.discount_type || undefined}
              onValueChange={(val) => handleOnFilterChange(val, 'discount_type')}
            >
              <SelectTrigger>
                <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
              </SelectTrigger>
              <SelectContent>
                {
                  discountTypeOptions.map((option) => (
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
  footer: {
    padding: `${theme.spacing[2]} ${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[3]}`,
    borderTop: `1px solid ${theme.colors.border.default}`,
    bottom: '-4px',
    position: 'sticky',
    backgroundColor: theme.colors.background.surface,
  },
});
