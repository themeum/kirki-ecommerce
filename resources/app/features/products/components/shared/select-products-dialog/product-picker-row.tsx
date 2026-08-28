import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import PriceText from '@/components/ui/price-text';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import type {
  ProductSelection,
  ProductVariantSelection,
} from '@/features/products/components/shared/select-products-dialog/types';
import type { ProductListItem } from '@/features/products/schemas/catalog/product';
import { ChevronDownIcon } from '@/icons';
import { __ } from '@/wpi18n';

type ProductPickerRowProps = {
  product: ProductListItem;
  selection: ProductSelection;
  expanded: boolean;
  onToggleExpand: () => void;
  selectVariants: boolean;
  isProductSelected: boolean;
  selectedVariantIds: Set<number>;
  onToggleProduct: (checked: boolean) => void;
  onToggleVariants: (
    variants: ProductVariantSelection[],
    checked: boolean,
  ) => void;
};

const ProductPickerRow = ({
  product,
  selection,
  expanded,
  onToggleExpand,
  selectVariants,
  isProductSelected,
  selectedVariantIds,
  onToggleProduct,
  onToggleVariants,
}: ProductPickerRowProps) => {
  const { variants } = selection;
  const selectedVariantCount = variants.filter((variant) =>
    selectedVariantIds.has(variant.variantId),
  ).length;

  const isChecked = selectVariants
    ? variants.length > 0 && selectedVariantCount === variants.length
    : isProductSelected;
  const isPartial =
    selectVariants &&
    selectedVariantCount > 0 &&
    selectedVariantCount < variants.length;

  const handleToggleAll = (checked: boolean) => {
    if (selectVariants) {
      onToggleVariants(variants, checked);
      return;
    }

    onToggleProduct(checked);
  };

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
            <Image src={product.image} alt={product.title} />
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
              aria-label={__('Toggle variants', 'kirki-ecommerce')}
              onClick={onToggleExpand}
              style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
            >
              <ChevronDownIcon />
            </Button>
          </Flex>
        </TableCell>
        <TableCell>
          {product.availability_label ?? __('Out of Stock', 'kirki-ecommerce')}
        </TableCell>
        <TableCell alignment="right">
          <PriceText
            salePrice={product.base_sale_price_money_object}
            regularPrice={product.base_price_money_object}
          />
        </TableCell>
      </TableRow>

      {expanded &&
        variants.map((variant) => (
          <TableRow key={variant.variantId}>
            <TableCell />
            <TableCell>
              <Flex gap={6} align="center">
                {selectVariants && (
                  <Checkbox
                    checked={selectedVariantIds.has(variant.variantId)}
                    onCheckedChange={(checked) =>
                      onToggleVariants([variant], checked === true)
                    }
                  />
                )}
                <Flex gap={3} align="center">
                  <Image
                    src={variant.thumbnail}
                    alt={variant.variantLabel}
                    size="sm"
                  />
                  <Text variant="small">{variant.variantLabel}</Text>
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
                salePrice={variant.salePrice}
                regularPrice={variant.regularPrice}
              />
            </TableCell>
          </TableRow>
        ))}
    </>
  );
};

ProductPickerRow.displayName = 'ProductPickerRow';

export default ProductPickerRow;
