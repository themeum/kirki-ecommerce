import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import { ChevronDownIcon } from '@/icons';
import { formatCurrency } from '@/pages/orders/order-create/config/order-totals';
import { getVariantLabel } from '@/pages/orders/order-create/config/variant-label';
import type { OrderLineDisplay } from '@/pages/orders/order-create/types';
import { useProductQuery } from '@/services/product';
import type { ProductListItem } from '@/types';
import { __ } from '@/wpi18n';

type ProductPickerRowProps = {
  product: ProductListItem;
  expanded: boolean;
  onToggleExpand: () => void;
  selectedVariantIds: Set<number>;
  onLinesLoaded: (productId: number, lines: OrderLineDisplay[]) => void;
  onToggleLines: (lines: OrderLineDisplay[], checked: boolean) => void;
};

const ProductPickerRow = ({
  product,
  expanded,
  onToggleExpand,
  selectedVariantIds,
  onLinesLoaded,
  onToggleLines,
}: ProductPickerRowProps) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [pendingSelectAll, setPendingSelectAll] = useState(false);
  const { data: detail, isLoading } = useProductQuery(
    product.id,
    expanded || shouldFetch,
  );

  const variantRows = useMemo(() => {
    if (!detail) {
      return [];
    }

    return detail.variants.reduce<
      { label: string; inStock: boolean; line: OrderLineDisplay }[]
    >((rows, variant) => {
      if (!variant.id) {
        return rows;
      }

      const label = getVariantLabel(detail.attributes, variant);

      rows.push({
        label: label || variant.sku || __('Default', 'kirki-ecommerce'),
        inStock: variant.in_stock,
        line: {
          variantId: variant.id,
          productTitle: product.title,
          variantLabel: label || undefined,
          thumbnail: variant.media?.url ?? product.image ?? null,
          unitPrice: Number(variant.price ?? 0),
        },
      });

      return rows;
    }, []);
  }, [detail, product.title, product.image]);

  useEffect(() => {
    if (variantRows.length === 0) {
      return;
    }

    onLinesLoaded(
      product.id,
      variantRows.map((row) => row.line),
    );
  }, [variantRows, product.id, onLinesLoaded]);

  useEffect(() => {
    if (!pendingSelectAll || variantRows.length === 0) {
      return;
    }

    onToggleLines(
      variantRows.map((row) => row.line),
      true,
    );
    setPendingSelectAll(false);
  }, [pendingSelectAll, variantRows, onToggleLines]);

  const handleToggleAll = (checked: boolean) => {
    if (variantRows.length > 0) {
      onToggleLines(
        variantRows.map((row) => row.line),
        checked,
      );
      return;
    }

    if (!checked) {
      setPendingSelectAll(false);
      return;
    }

    setShouldFetch(true);
    setPendingSelectAll(true);
  };

  const selectedCount = variantRows.filter((row) =>
    selectedVariantIds.has(row.line.variantId),
  ).length;
  const isChecked =
    variantRows.length > 0 && selectedCount === variantRows.length;
  const isPartial = selectedCount > 0 && selectedCount < variantRows.length;

  return (
    <>
      <TableRow>
        <TableCell onlyCheckbox>
          <Checkbox
            checked={isChecked || pendingSelectAll}
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
          {formatCurrency(Number(product.price ?? 0))}
        </TableCell>
      </TableRow>

      {expanded && isLoading && (
        <TableRow>
          <TableCell colSpan={4}>
            <Text variant="small" color="secondary">
              {__('Loading variants...', 'kirki-ecommerce')}
            </Text>
          </TableCell>
        </TableRow>
      )}

      {expanded &&
        !isLoading &&
        variantRows.map((row) => (
          <TableRow key={row.line.variantId}>
            <TableCell></TableCell>
            <TableCell>
              <Flex gap={6} align="center">
                <Checkbox
                  checked={selectedVariantIds.has(row.line.variantId)}
                  onCheckedChange={(checked) =>
                    onToggleLines([row.line], checked === true)
                  }
                />
                <Flex gap={3} align="center">
                  <Thumbnail
                    src={row.line.thumbnail ?? undefined}
                    alt={row.label}
                    size="small"
                  />
                  <Text variant="small">{row.label}</Text>
                </Flex>
              </Flex>
            </TableCell>
            <TableCell>
              {row.inStock
                ? __('In Stock', 'kirki-ecommerce')
                : __('Out of Stock', 'kirki-ecommerce')}
            </TableCell>
            <TableCell alignment="right">
              {formatCurrency(row.line.unitPrice)}
            </TableCell>
          </TableRow>
        ))}
    </>
  );
};

ProductPickerRow.displayName = 'ProductPickerRow';

export default ProductPickerRow;
