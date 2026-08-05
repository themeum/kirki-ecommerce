import PriceText from '@/components/shared/price-text';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import { ChevronDownIcon } from '@/icons';
import type {
  OrderRowDisplay,
  ProductPickerItem,
} from '@/pages/orders/order-create/types';
import type { ProductListItem } from '@/types';
import { __ } from '@/wpi18n';

type ProductPickerRowProps = {
  product: ProductListItem;
  variants: ProductPickerItem[];
  expanded: boolean;
  onToggleExpand: () => void;
  selectedVariantIds: Set<number>;
  onToggleRows: (lines: OrderRowDisplay[], checked: boolean) => void;
};

const ProductPickerRow = ({
  product,
  variants,
  expanded,
  onToggleExpand,
  selectedVariantIds,
  onToggleRows,
}: ProductPickerRowProps) => {
  const handleToggleAll = (checked: boolean) => {
    onToggleRows(
      variants.map((variantItem) => variantItem.row),
      checked,
    );
  };

  const selectedCount = variants.filter((variantItem) =>
    selectedVariantIds.has(variantItem.row.variantId),
  ).length;
  const isChecked = variants.length > 0 && selectedCount === variants.length;
  const isPartial = selectedCount > 0 && selectedCount < variants.length;

  return (
    <>
      <TableRow>
        <TableCell onlyCheckbox>
          <Checkbox
            checked={isChecked}
            isPartialChecked={isPartial}
            onCheckedChange={(checked) => handleToggleAll(checked === true)}
          />
        </TableCell>
        <TableCell>
          <Flex gap={3} align="center">
            <Thumbnail src={product.image ?? undefined} alt={product.title} />
            <Flex direction="column" gap={1}>
              <Text weight="medium">{product.title}</Text>
              {product.sku && (
                <Text variant="small" color="secondary">
                  {product.sku}
                </Text>
              )}
            </Flex>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Toggle variants"
              onClick={onToggleExpand}
              style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
            >
              <ChevronDownIcon />
            </Button>
          </Flex>
        </TableCell>
        <TableCell>
          {Number(product.inventory ?? 0) > 0
            ? __('In Stock', 'kirki-ecommerce')
            : __('Out of Stock', 'kirki-ecommerce')}
        </TableCell>
        <TableCell alignment="right">
          <PriceText
            salePrice={product.sale_price_object}
            regularPrice={product.price_object}
          />
        </TableCell>
      </TableRow>

      {expanded &&
        variants.map((variant) => (
          <TableRow key={variant.row.variantId}>
            <TableCell></TableCell>
            <TableCell>
              <Flex gap={6} align="center">
                <Checkbox
                  checked={selectedVariantIds.has(variant.row.variantId)}
                  onCheckedChange={(checked) =>
                    onToggleRows([variant.row], checked === true)
                  }
                />
                <Flex gap={3} align="center">
                  <Thumbnail
                    src={variant.row.thumbnail ?? undefined}
                    alt={variant.label}
                    size="small"
                  />
                  <Text variant="small">{variant.label}</Text>
                </Flex>
              </Flex>
            </TableCell>
            <TableCell>
              {variant.inStock
                ? __('In Stock', 'kirki-ecommerce')
                : __('Out of Stock', 'kirki-ecommerce')}
            </TableCell>
            <TableCell alignment="right">
              <PriceText
                salePrice={variant.row.salePrice}
                regularPrice={variant.row.regularPrice}
              />
            </TableCell>
          </TableRow>
        ))}
    </>
  );
};

ProductPickerRow.displayName = 'ProductPickerRow';

export default ProductPickerRow;
