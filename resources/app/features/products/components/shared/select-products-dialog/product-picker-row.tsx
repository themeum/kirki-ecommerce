import { type MouseEvent, useCallback, useMemo, useRef } from 'react';

import Badge from '@/components/ui/badge';
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
  SelectProductsMode,
} from '@/features/products/components/shared/select-products-dialog/types';
import type { ProductListItem } from '@/features/products/schemas/catalog/product';
import { ChevronDownIcon } from '@/icons';
import { __, sprintf } from '@/wpi18n';

type ProductPickerRowProps = {
  product: ProductListItem;
  selection: ProductSelection;
  expanded: boolean;
  onToggleExpand: () => void;
  mode: SelectProductsMode;
  isProductSelected: boolean;
  selectedVariantIds: Set<number>;
  lockedVariantIds: Set<number>;
  onToggleProduct: (checked: boolean) => void;
  onToggleVariants: (variants: ProductVariantSelection[], checked: boolean) => void;
  onToggleRange: (checked: boolean, variant?: ProductVariantSelection) => void;
  onSetAnchor: (variant?: ProductVariantSelection) => void;
};

const ProductPickerRow = ({
  product,
  selection,
  expanded,
  onToggleExpand,
  mode,
  isProductSelected,
  selectedVariantIds,
  lockedVariantIds,
  onToggleProduct,
  onToggleVariants,
  onToggleRange,
  onSetAnchor,
}: ProductPickerRowProps) => {
  const { variants } = selection;
  const isOrderMode = mode === 'order';
  const unlockedVariants = useMemo(
    () => variants.filter((variant) => !lockedVariantIds.has(variant.variantId)),
    [variants, lockedVariantIds],
  );
  const selectedVariantCount = unlockedVariants.filter((variant) =>
    selectedVariantIds.has(variant.variantId),
  ).length;
  const isFullyLocked = variants.length > 0 && unlockedVariants.length === 0;

  const isChecked = isOrderMode
    ? unlockedVariants.length > 0 && selectedVariantCount === unlockedVariants.length
    : isProductSelected;
  const isPartial =
    isOrderMode && selectedVariantCount > 0 && selectedVariantCount < unlockedVariants.length;

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      if (isOrderMode) {
        onToggleVariants(variants, checked);
        return;
      }

      onToggleProduct(checked);
    },
    [isOrderMode, onToggleVariants, variants, onToggleProduct],
  );

  const isShiftHeld = useRef(false);

  const handleProductToggle = useCallback(
    (checked: boolean) => {
      const isRangeSelection = isShiftHeld.current;
      isShiftHeld.current = false;

      if (isRangeSelection) {
        onToggleRange(checked);
      } else {
        handleToggleAll(checked);
      }

      onSetAnchor();
    },
    [handleToggleAll, onToggleRange, onSetAnchor],
  );

  const handleProductRowClick = useCallback(
    (event: MouseEvent<HTMLTableRowElement>) => {
      if (isFullyLocked) {
        return;
      }

      isShiftHeld.current = event.shiftKey;
      handleProductToggle(!isChecked);
    },
    [isFullyLocked, isChecked, handleProductToggle],
  );

  const handleVariantToggle = useCallback(
    (variant: ProductVariantSelection, checked: boolean) => {
      const isRangeSelection = isShiftHeld.current;
      isShiftHeld.current = false;

      if (isRangeSelection) {
        onToggleRange(checked, variant);
      } else {
        onToggleVariants([variant], checked);
      }

      onSetAnchor(variant);
    },
    [onToggleVariants, onToggleRange, onSetAnchor],
  );

  const handleVariantRowClick = useCallback(
    (event: MouseEvent<HTMLTableRowElement>, variant: ProductVariantSelection) => {
      if (lockedVariantIds.has(variant.variantId)) {
        return;
      }

      isShiftHeld.current = event.shiftKey;
      handleVariantToggle(variant, !selectedVariantIds.has(variant.variantId));
    },
    [handleVariantToggle, selectedVariantIds, lockedVariantIds],
  );

  const handleToggleExpandClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onToggleExpand();
    },
    [onToggleExpand],
  );

  return (
    <>
      <TableRow
        onClick={handleProductRowClick}
        cssOverride={{ cursor: isFullyLocked ? 'default' : 'pointer' }}
      >
        <TableCell onlyCheckbox>
          <Checkbox
            checked={isChecked}
            isPartialChecked={isPartial}
            disabled={isFullyLocked}
            onClick={(event) => {
              isShiftHeld.current = event.shiftKey;
            }}
            onCheckedChange={(checked) => handleProductToggle(checked === true)}
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
              {!isOrderMode && variants.length > 1 && (
                <Text variant="small" color="secondary">
                  {sprintf(
                    /* translators: %s: number of variants */
                    __('%s Variants', 'kirki-ecommerce'),
                    variants.length,
                  )}
                </Text>
              )}
            </Flex>
            {isFullyLocked && (
              <Badge variant="destructive">{__('Item already picked', 'kirki-ecommerce')}</Badge>
            )}
            {isOrderMode && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={__('Toggle variants', 'kirki-ecommerce')}
                onClick={handleToggleExpandClick}
                style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
              >
                <ChevronDownIcon />
              </Button>
            )}
          </Flex>
        </TableCell>
        <TableCell>{product.availability_label ?? __('Out of Stock', 'kirki-ecommerce')}</TableCell>
        <TableCell alignment="right">
          <PriceText
            salePrice={product.base_sale_price_money_object}
            regularPrice={product.base_price_money_object}
          />
        </TableCell>
      </TableRow>

      {expanded &&
        isOrderMode &&
        variants.map((variant) => {
          const isLocked = lockedVariantIds.has(variant.variantId);

          return (
            <TableRow
              key={variant.variantId}
              onClick={(event) => handleVariantRowClick(event, variant)}
              cssOverride={{ cursor: isLocked ? 'default' : 'pointer' }}
            >
              <TableCell />
              <TableCell>
                <Flex gap={6} align="center">
                  <Checkbox
                    checked={selectedVariantIds.has(variant.variantId)}
                    disabled={isLocked}
                    onClick={(event) => {
                      isShiftHeld.current = event.shiftKey;
                    }}
                    onCheckedChange={(checked) => handleVariantToggle(variant, checked === true)}
                  />
                  <Flex gap={3} align="center">
                    <Image src={variant.thumbnail} alt={variant.variantLabel} size="sm" />
                    <Text variant="small">{variant.variantLabel}</Text>
                    {isLocked && (
                      <Badge variant="destructive">
                        {__('Item already picked', 'kirki-ecommerce')}
                      </Badge>
                    )}
                  </Flex>
                </Flex>
              </TableCell>
              <TableCell>
                {variant.inStock
                  ? __('In Stock', 'kirki-ecommerce')
                  : __('Out of Stock', 'kirki-ecommerce')}
              </TableCell>
              <TableCell alignment="right">
                <PriceText salePrice={variant.salePrice} regularPrice={variant.regularPrice} />
              </TableCell>
            </TableRow>
          );
        })}
    </>
  );
};

ProductPickerRow.displayName = 'ProductPickerRow';

export default ProductPickerRow;
