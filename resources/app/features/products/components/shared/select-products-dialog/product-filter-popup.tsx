import { memo, type ReactNode, useEffect, useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import BrandFilter from '@/features/products/components/product-table/filter-popup/brand-filter';
import CategoriesFilter from '@/features/products/components/product-table/filter-popup/categories-filter';
import CollectionFilter from '@/features/products/components/product-table/filter-popup/collection-filter';
import InventoryTypeFilter from '@/features/products/components/product-table/filter-popup/inventory-filter';
import StatusFilter from '@/features/products/components/product-table/filter-popup/status-filter';
import { CloseIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type ProductFilterValue = {
  category_ids: number[];
  status: string;
  availability_status: string;
  collection_ids: number | undefined;
  brand_ids: number | undefined;
};

type ProductFilterPopupProps = {
  value: ProductFilterValue;
  onApply: (value: ProductFilterValue) => void;
  children: ReactNode;
};

const emptyFilter: ProductFilterValue = {
  category_ids: [],
  status: 'all',
  availability_status: 'all',
  collection_ids: undefined,
  brand_ids: undefined,
};

const ProductFilterPopup = memo(({ value, onApply, children }: ProductFilterPopupProps) => {
  const [openPopup, setOpenPopup] = useState(false);
  const [filterObject, setFilterObject] = useState<ProductFilterValue>(emptyFilter);

  const filterCount = [
    value.category_ids?.length,
    value.availability_status,
    value.collection_ids,
    value.brand_ids,
  ].filter(Boolean).length;

  const hasFilter = Boolean(
    filterObject.category_ids.length ||
    filterObject.availability_status ||
    filterObject.collection_ids ||
    filterObject.brand_ids,
  );

  useEffect(() => {
    if (!openPopup) {
      return;
    }
    setFilterObject({
      category_ids: value.category_ids || [],
      status: value.status || 'all',
      availability_status: value.availability_status || 'all',
      collection_ids: value.collection_ids,
      brand_ids: value.brand_ids,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seeds the draft filters from `value` only as the popup opens; tracking value.* would overwrite the user edits as they change each control
  }, [openPopup]);

  const handleOnFilterChange = (
    val: string | number | (string | number)[],
    filterName: keyof ProductFilterValue,
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
    onApply(filterObject);
    handleFilterClose();
  };

  const handleOnClearFilter = () => {
    onApply(emptyFilter);
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
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        {filterCount ? (
          <Button
            variant="outline"
            cssOverride={{
              color: theme.colors.text.emphasis,
              backgroundColor: theme.colors.background.fillSecondary,
              borderLeft: 'none',
              cursor: 'default',
              borderRadius: `${theme.radius.none} ${theme.radius.md} ${theme.radius.md} ${theme.radius.none}`,
            }}
          >
            {sprintf(__('%d', 'kirki-ecommerce'), filterCount)}
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
            <Button
              variant="ghost"
              onClick={handleOnClearFilter}
              disabled={!hasFilter}
            >
              {__('Clear Filter', 'kirki-ecommerce')}
            </Button>
            <Button variant="primary" onClick={handleOnApplyFilter}>
              {__('Apply Filter', 'kirki-ecommerce')}
            </Button>
          </ActionGroup>
        </Flex>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ProductFilterPopup.displayName = 'ProductFilterPopup';

export default ProductFilterPopup;
export type { ProductFilterValue };

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
