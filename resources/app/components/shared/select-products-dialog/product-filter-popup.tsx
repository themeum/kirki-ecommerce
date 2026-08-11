import { memo, type ReactNode, useEffect, useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Text from '@/components/ui/text';
import { CloseIcon } from '@/icons';
import BrandFilter from '@/pages/products/product-table/filter-popup/brand-filter';
import CategoriesFilter from '@/pages/products/product-table/filter-popup/categories-filter';
import CollectionFilter from '@/pages/products/product-table/filter-popup/collection-filter';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type ProductFilterValue = {
  category_ids: number[];
  stock_status: string;
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
  stock_status: '',
  collection_ids: undefined,
  brand_ids: undefined,
};

const ProductFilterPopup = memo(({ value, onApply, children }: ProductFilterPopupProps) => {
  const [openPopup, setOpenPopup] = useState(false);
  const [filterObject, setFilterObject] = useState<ProductFilterValue>(emptyFilter);

  const filterCount = [
    value.category_ids?.length,
    value.stock_status,
    value.collection_ids,
    value.brand_ids,
  ].filter(Boolean).length;

  const hasFilter = Boolean(
    filterObject.category_ids.length ||
    filterObject.stock_status ||
    filterObject.collection_ids ||
    filterObject.brand_ids,
  );

  useEffect(() => {
    if (!openPopup) {
      return;
    }
    setFilterObject({
      category_ids: value.category_ids || [],
      stock_status: value.stock_status || '',
      collection_ids: value.collection_ids,
      brand_ids: value.brand_ids,
    });
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
