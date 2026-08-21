import Checkbox from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import ProductPickerRow from '@/features/products/components/shared/select-products-dialog/product-picker-row';
import type { ProductSelection, ProductVariantSelection } from '@/features/products/components/shared/select-products-dialog/types';
import type { ProductListItemWithVariants } from '@/features/products/schemas/catalog/product';
import ProductPickerSkeleton from '@/features/products/skeletons/product-picker-skeleton';
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
  expandAll?: boolean;
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
    expandAll = false,
    onToggleExpand,
    selectedProductIds,
    selectedVariantIds,
    onToggleProduct,
    onToggleVariants,
  } = props;

  return (
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
          <TableHead alignment="right">
            {__('Price', 'kirki-ecommerce')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && <ProductPickerSkeleton />}
        {!isLoading && pickerItems.length === 0 && (
          <TableRow>
            <TableCell colSpan={4}>
              <Text variant="small" color="secondary">
                {__('No products found.', 'kirki-ecommerce')}
              </Text>
            </TableCell>
          </TableRow>
        )}
        {pickerItems.map((item) => (
          <ProductPickerRow
            key={item.product.id}
            product={item.product}
            selection={item.selection}
            expanded={expandAll || expandedProductIds.has(item.product.id)}
            onToggleExpand={() => onToggleExpand(item.product.id)}
            selectVariants={selectVariants}
            isProductSelected={selectedProductIds.has(item.product.id)}
            selectedVariantIds={selectedVariantIds}
            onToggleProduct={(checked) => onToggleProduct(item.selection, checked)}
            onToggleVariants={(variants, checked) =>
              onToggleVariants(item.selection, variants, checked)
            }
          />
        ))}
      </TableBody>
    </Table>
  );
};

ProductTable.displayName = 'ProductTable';

export default ProductTable;
