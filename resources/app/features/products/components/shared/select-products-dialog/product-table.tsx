import { useRef } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Text from '@/components/ui/text';
import ProductPickerRow from '@/features/products/components/shared/select-products-dialog/product-picker-row';
import type {
  ProductSelection,
  ProductVariantSelection,
} from '@/features/products/components/shared/select-products-dialog/types';
import type { ProductListItemWithVariants } from '@/features/products/schemas/catalog/product';
import ProductPickerSkeleton from '@/features/products/skeletons/product-picker-skeleton';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type ProductPickerItem = {
  product: ProductListItemWithVariants;
  selection: ProductSelection;
};

type ProductTableProps = {
  isLoading: boolean;
  pickerItems: ProductPickerItem[];
  selectVariants: boolean;
  allOnPageSelected: boolean;
  partialOnPageSelected: boolean;
  pageSelectableCount: number;
  onToggleAllOnPage: (checked: boolean) => void;
  expandedProductIds: Set<number>;
  onToggleExpand: (productId: number) => void;
  selectedProductIds: Set<number>;
  selectedVariantIds: Set<number>;
  onToggleProduct: (product: ProductSelection, checked: boolean) => void;
  onToggleVariants: (
    product: ProductSelection,
    variants: ProductVariantSelection[],
    checked: boolean,
  ) => void;
};

const ProductTable = (props: ProductTableProps) => {
  const {
    isLoading,
    pickerItems,
    selectVariants,
    allOnPageSelected,
    partialOnPageSelected,
    pageSelectableCount,
    onToggleAllOnPage,
    expandedProductIds,
    onToggleExpand,
    selectedProductIds,
    selectedVariantIds,
    onToggleProduct,
    onToggleVariants,
  } = props;

  const anchorRowKey = useRef<string | null>(null);

  const getRowKey = (productId: number, variant?: ProductVariantSelection) =>
    variant ? `variant-${variant.variantId}` : `product-${productId}`;

  const handleSetAnchor = (item: ProductPickerItem, variant?: ProductVariantSelection) => {
    anchorRowKey.current = getRowKey(item.product.id, variant);
  };

  const handleToggleRange = (
    item: ProductPickerItem,
    checked: boolean,
    variant?: ProductVariantSelection,
  ) => {
    const visibleRows = pickerItems.flatMap((pickerItem) => {
      const productRow = { pickerItem, variant: undefined as ProductVariantSelection | undefined };
      const variantRows =
        selectVariants && expandedProductIds.has(pickerItem.product.id)
          ? pickerItem.selection.variants.map((rowVariant) => ({
              pickerItem,
              variant: rowVariant,
            }))
          : [];

      return [productRow, ...variantRows];
    });
    const findRowIndex = (key: string | null) =>
      visibleRows.findIndex((row) => getRowKey(row.pickerItem.product.id, row.variant) === key);

    const anchorIndex = findRowIndex(anchorRowKey.current);
    const targetIndex = findRowIndex(getRowKey(item.product.id, variant));
    const rangeRows =
      anchorIndex === -1 || targetIndex === -1
        ? [{ pickerItem: item, variant }]
        : visibleRows.slice(
            Math.min(anchorIndex, targetIndex),
            Math.max(anchorIndex, targetIndex) + 1,
          );

    const isTargetRow = (row: (typeof rangeRows)[number]) =>
      row.pickerItem === item && row.variant === variant;

    rangeRows.forEach((row) => {
      const isExpandedProductRow =
        !row.variant && selectVariants && expandedProductIds.has(row.pickerItem.product.id);

      if (isExpandedProductRow && !isTargetRow(row)) {
        return;
      }

      if (row.variant) {
        onToggleVariants(row.pickerItem.selection, [row.variant], checked);
      } else if (selectVariants) {
        onToggleVariants(row.pickerItem.selection, row.pickerItem.selection.variants, checked);
      } else {
        onToggleProduct(row.pickerItem.selection, checked);
      }
    });
  };

  return (
    <Card
      cssOverride={mergeCss(cardStyles.innerCard, cardStyles.tableCardRounded, styles.tableCard)}
    >
      <CardContent cssOverride={cardStyles.tableContent}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onlyCheckbox>
                <Checkbox
                  checked={allOnPageSelected}
                  isPartialChecked={partialOnPageSelected}
                  disabled={pageSelectableCount === 0}
                  onCheckedChange={(checked) => onToggleAllOnPage(checked === true)}
                />
              </TableHead>
              <TableHead>
                {selectVariants
                  ? __('Variants', 'kirki-ecommerce')
                  : __('Products', 'kirki-ecommerce')}
              </TableHead>
              <TableHead>{__('Inventory', 'kirki-ecommerce')}</TableHead>
              <TableHead alignment="right">{__('Price', 'kirki-ecommerce')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <ProductPickerSkeleton />
            ) : pickerItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Text variant="small" color="secondary">
                    {__('No products found.', 'kirki-ecommerce')}
                  </Text>
                </TableCell>
              </TableRow>
            ) : (
              pickerItems.map((item) => (
                <ProductPickerRow
                  key={item.product.id}
                  product={item.product}
                  selection={item.selection}
                  expanded={expandedProductIds.has(item.product.id)}
                  onToggleExpand={() => onToggleExpand(item.product.id)}
                  selectVariants={selectVariants}
                  isProductSelected={selectedProductIds.has(item.product.id)}
                  selectedVariantIds={selectedVariantIds}
                  onToggleProduct={(checked) => onToggleProduct(item.selection, checked)}
                  onToggleVariants={(variants, checked) =>
                    onToggleVariants(item.selection, variants, checked)
                  }
                  onToggleRange={(checked, variant) => handleToggleRange(item, checked, variant)}
                  onSetAnchor={(variant) => handleSetAnchor(item, variant)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

ProductTable.displayName = 'ProductTable';

export default ProductTable;

const styles = defineStyles({
  tableCard: {
    overflow: 'auto',
  },
});
