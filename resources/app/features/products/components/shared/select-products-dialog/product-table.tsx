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
import {
  useSelectProductsActions,
  useSelectProductsState,
} from '@/features/products/components/shared/select-products-dialog/select-products-context';
import ProductPickerSkeleton from '@/features/products/skeletons/product-picker-skeleton';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const ProductTable = () => {
  const {
    isLoading,
    pickerItems,
    mode,
    selection,
    expandedProductIds,
    lockedVariantIds,
    allOnPageSelected,
    partialOnPageSelected,
    pageSelectableCount,
  } = useSelectProductsState();
  const { toggleAllOnPage } = useSelectProductsActions();

  const isOrderMode = mode === 'order';

  return (
    <Card
      cssOverride={mergeCss(cardStyles.innerCard, cardStyles.tableCardRounded, styles.tableCard)}
    >
      <CardContent cssOverride={cardStyles.tableContent}>
        <Table cssOverride={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHead onlyCheckbox>
                <Checkbox
                  checked={allOnPageSelected}
                  isPartialChecked={partialOnPageSelected}
                  disabled={pageSelectableCount === 0}
                  onCheckedChange={(checked) => toggleAllOnPage(checked === true)}
                />
              </TableHead>
              <TableHead>
                {isOrderMode
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
                  item={item}
                  mode={mode}
                  lockedVariantIds={lockedVariantIds}
                  selectedEntry={selection.get(item.product.id)}
                  expanded={expandedProductIds.has(item.product.id)}
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
  table: {
    '& thead': {
      border: 'none',
    },
  },
});
