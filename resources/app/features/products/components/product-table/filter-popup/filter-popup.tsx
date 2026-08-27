import { type ComponentProps, memo, useEffect, useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { ProductListFilter } from '@/features/products';
import { productListOptions } from '@/features/products';
import BrandFilter from '@/features/products/components/product-table/filter-popup/brand-filter';
import CategoriesFilter from '@/features/products/components/product-table/filter-popup/categories-filter';
import CollectionFilter from '@/features/products/components/product-table/filter-popup/collection-filter';
import InventoryTypeFilter from '@/features/products/components/product-table/filter-popup/inventory-filter';
import StatusFilter from '@/features/products/components/product-table/filter-popup/status-filter';
import { useListParams } from '@/hooks';
import { CloseIcon, ListFilter } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { __, sprintf } from '@/wpi18n';

type LocalFilterState = {
  category_ids: number[];
  status: string;
  availability_status: string;
  collection_ids: number | undefined;
  brand_ids: number | undefined;
};

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
  const { params, setParams } = useListParams<ProductListFilter>(productListOptions);
  const [openPopup, setOpenPopup] = useState(false);
  const [filterObject, setFilterObject] = useState<LocalFilterState>({
    category_ids: [],
    status: 'all',
    availability_status: 'all',
    collection_ids: undefined,
    brand_ids: undefined,
  });

  const hasFilter = [
    params.category_ids?.length,
    params.status,
    params.availability_status,
    params.collection_ids?.length,
    params.brand_ids?.length,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!openPopup) {
      return;
    }
    setFilterObject({
      category_ids: params.category_ids ?? [],
      status: (params.status as string) || 'all',
      availability_status: params.availability_status || 'all',
      collection_ids: params.collection_ids?.[0],
      brand_ids: params.brand_ids?.[0],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seeds the draft filters from the URL params only as the popup opens; tracking params.* would overwrite the user edits as they change each control
  }, [openPopup]);

  const handleOnFilterChange = (
    val: string | number | (string | number)[],
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
      availability_status:
        filterObject.availability_status && filterObject.availability_status !== 'all'
          ? filterObject.availability_status
          : undefined,
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
      availability_status: 'all',
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
      <DropdownMenuContent cssOverride={{ width: '288px', maxHeight: '522px' }}>
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
          <StatusFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, 'status')}
          />
          <InventoryTypeFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, 'availability_status')}
          />
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
