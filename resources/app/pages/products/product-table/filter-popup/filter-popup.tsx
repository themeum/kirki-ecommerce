import { memo, useEffect, useState, type ComponentProps } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Text from '@/components/ui/text';
import { CloseIcon, ListFilter } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

import { useListParams } from '@/hooks';
import BrandFilter from '@/pages/products/product-table/filter-popup/brand-filter';
import CategoriesFilter from '@/pages/products/product-table/filter-popup/categories-filter';
import CollectionFilter from '@/pages/products/product-table/filter-popup/collection-filter';
import { ProductListFilter, productListOptions } from '@/types/filters/product';

type LocalFilterState = {
  category_ids: number[];
  status: string;
  stock_status: string;
  collection_ids: number | undefined;
  brand_ids: number | undefined;
};

type FilterPopupProps = {
  onChange?: () => void;
  buttonProps?: ComponentProps<typeof Button>;
  data?: unknown;
};

const FilterPopup = memo(({
  onChange: _onChange = () => { },
  buttonProps,
  data: _data,
}: FilterPopupProps) => {
  const { params, setParams } = useListParams<ProductListFilter>(productListOptions);
  const [openPopup, setOpenPopup] = useState(false);
  const [filterObject, setFilterObject] = useState<LocalFilterState>({
    category_ids: [],
    status: 'all',
    stock_status: '',
    collection_ids: undefined,
    brand_ids: undefined,
  });

  const hasFilter = [
    params.category_ids?.length,
    params.status,
    params.stock_status,
    params.collection_ids?.length,
    params.brand_ids?.length,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!openPopup) {
      return;
    }
    setFilterObject({
      category_ids: params.category_ids || [],
      status: (params.status as string) || 'all',
      stock_status: params.stock_status || '',
      collection_ids: params.collection_ids?.[0],
      brand_ids: params.brand_ids?.[0],
    });
  }, [openPopup]);

  const handleOnFilterChange = (
    val: string | number | Array<string | number>,
    filterName: keyof LocalFilterState,
  ) => {
    setFilterObject((prev) => ({
      ...prev,
      [filterName]: val,
    }));
  };

  const handleOnApplyFilter = () => {
    setParams({
      category_ids: filterObject.category_ids.length
        ? filterObject.category_ids
        : undefined,
      status:
        filterObject.status && filterObject.status !== 'all'
          ? filterObject.status
          : undefined,
      stock_status: filterObject.stock_status || undefined,
      collection_ids: filterObject.collection_ids
        ? [filterObject.collection_ids]
        : undefined,
      brand_ids: filterObject.brand_ids ? [filterObject.brand_ids] : undefined,
    });
    handleFilterClose();
  };

  const handleFilterClose = () => {
    setFilterObject({
      category_ids: [],
      status: 'all',
      stock_status: '',
      collection_ids: undefined,
      brand_ids: undefined,
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

        <Flex direction="column" gap={4} cssOverride={{ padding: `${theme.spacing[2]} ${theme.spacing[3]}`, overflowY: 'auto', minHeight: '400px' }}>
          <CategoriesFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, 'category_ids')}
          />
          <Flex direction="column" gap={2}>
            <Label>{__('Status', 'kirki-ecommerce')}</Label>
            <RadioGroup
              defaultValue="all"
              value={filterObject.status || 'all'}
              onValueChange={(val) => handleOnFilterChange(val, 'status')}
            >
              {[
                {
                  value: 'published',
                  label: __('Published', 'kirki-ecommerce'),
                },
                { value: 'draft', label: __('Draft', 'kirki-ecommerce') },
                { value: 'all', label: __('All', 'kirki-ecommerce') },
              ].map((option) => (
                <Field key={option.value} orientation="horizontal">
                  <RadioGroupItem
                    value={option.value}
                    id={`filter-status-${option.value}`}
                  />
                  <FieldLabel htmlFor={`filter-status-${option.value}`}>
                    {option.label}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          </Flex>
          <Flex direction="column" gap={2}>
            <Label>{__('Inventory', 'kirki-ecommerce')}</Label>
            <Select
              value={filterObject.stock_status || undefined}
              onValueChange={(val) => handleOnFilterChange(val, 'stock_status')}
            >
              <SelectTrigger>
                <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">
                  {__('In stock', 'kirki-ecommerce')}
                </SelectItem>
                <SelectItem value="out_of_stock">
                  {__('Out of stock', 'kirki-ecommerce')}
                </SelectItem>
              </SelectContent>
            </Select>
          </Flex>
          <CollectionFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, 'collection_ids')}
          />
          <BrandFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, 'brand_ids')}
          />
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
    zIndex: 100,
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
