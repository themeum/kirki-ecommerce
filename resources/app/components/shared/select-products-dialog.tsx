import { useMemo, useState } from 'react';

import Pagination from '@/components/pagination';
import ProductFilterPopup, { type ProductFilterValue } from '@/components/shared/select-products-dialog/product-filter-popup';
import ProductPickerRow from '@/components/shared/select-products-dialog/product-picker-row';
import type {
  ProductSelection,
  ProductVariantSelection,
} from '@/components/shared/select-products-dialog/types';
import { getVariantLabel } from '@/components/shared/select-products-dialog/variant-label';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Text from '@/components/ui/text';
import { BoxIcon, ListFilter } from '@/icons';
import type { ProductListItemWithVariants } from '@/schemas/catalog/product';
import { useProductsWithVariantsQuery } from '@/services/product';
import type { PaginationData } from '@/types';
import { __, _n, sprintf } from '@/wpi18n';

type SelectProductsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (selections: ProductSelection[]) => void;
  selectedProducts: ProductSelection[];
  selectVariants?: boolean;
};

const LIMIT = 12;

const buildVariantSelections = (
  product: ProductListItemWithVariants,
): ProductVariantSelection[] =>
  product.variants.reduce<ProductVariantSelection[]>((variants, variant) => {
    if (!variant.id) {
      return variants;
    }

    const label = getVariantLabel(product.attributes, variant);

    variants.push({
      variantId: variant.id,
      variantLabel:
        label || variant.sku || __('Default', 'kirki-ecommerce'),
      thumbnail: variant.media?.url ?? product.image ?? null,
      inStock: variant.in_stock,
      regularPrice: variant.base_price_money_object,
      salePrice: variant.base_sale_price_money_object,
    });

    return variants;
  }, []);

const buildProductSelection = (product: ProductListItemWithVariants): ProductSelection => ({
  productId: product.id,
  productTitle: product.title,
  thumbnail: product.image ?? null,
  inStock: Number(product.inventory ?? 0) > 0,
  regularPrice: product.base_price_money_object,
  salePrice: product.base_sale_price_money_object,
  variants: buildVariantSelections(product),
});

const applyProductToggle = (
  selection: Map<number, ProductSelection>,
  product: ProductSelection,
  checked: boolean,
): Map<number, ProductSelection> => {
  const next = new Map(selection);

  if (checked) {
    next.set(product.productId, product);
  } else {
    next.delete(product.productId);
  }

  return next;
};

const applyVariantToggle = (
  selection: Map<number, ProductSelection>,
  product: ProductSelection,
  variants: ProductVariantSelection[],
  checked: boolean,
): Map<number, ProductSelection> => {
  const next = new Map(selection);
  const selectedVariantIds = new Set(
    (next.get(product.productId)?.variants ?? []).map(
      (variant) => variant.variantId,
    ),
  );

  variants.forEach((variant) => {
    if (checked) {
      selectedVariantIds.add(variant.variantId);
      return;
    }

    selectedVariantIds.delete(variant.variantId);
  });

  const selectedVariants = product.variants.filter((variant) =>
    selectedVariantIds.has(variant.variantId),
  );

  if (selectedVariants.length === 0) {
    next.delete(product.productId);
    return next;
  }

  next.set(product.productId, { ...product, variants: selectedVariants });

  return next;
};

const SelectProductsDialog = ({
  open,
  onOpenChange,
  onAdd,
  selectedProducts,
  selectVariants = true,
}: SelectProductsDialogProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ProductFilterValue>({
    category_ids: [],
    stock_status: '',
    collection_ids: undefined,
    brand_ids: undefined,
  });
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(
    new Set(),
  );
  const [selection, setSelection] = useState<Map<number, ProductSelection>>(
    () =>
      new Map(
        selectedProducts.map((product) => [product.productId, product]),
      ),
  );

  const { data, isLoading } = useProductsWithVariantsQuery({
    search,
    page,
    limit: LIMIT,
    sort_by: 'title',
    sort_order: 'asc',
    status: 'published',
    category_ids: filters.category_ids.length ? filters.category_ids : undefined,
    stock_status: filters.stock_status || undefined,
    collection_ids: filters.collection_ids ? [filters.collection_ids] : undefined,
    brand_ids: filters.brand_ids ? [filters.brand_ids] : undefined,
  }, open);

  const products = useMemo(() => data?.results ?? [], [data?.results]);
  const pickerItems = useMemo(
    () =>
      products.map((product) => ({
        product,
        selection: buildProductSelection(product),
      })),
    [products],
  );

  const selectedProductIds = useMemo(
    () => new Set(selection.keys()),
    [selection],
  );
  const selectedVariantIds = useMemo(
    () =>
      new Set(
        Array.from(selection.values()).flatMap((product) =>
          product.variants.map((variant) => variant.variantId),
        ),
      ),
    [selection],
  );
  const selectedCount = selectVariants
    ? selectedVariantIds.size
    : selectedProductIds.size;

  const pageSelectableCount = selectVariants
    ? pickerItems.reduce((total, item) => total + item.selection.variants.length, 0)
    : pickerItems.length;
  const selectedOnPageCount = selectVariants
    ? pickerItems.reduce(
      (total, item) =>
        total +
        item.selection.variants.filter((variant) =>
          selectedVariantIds.has(variant.variantId),
        ).length,
      0,
    )
    : pickerItems.filter((item) => selectedProductIds.has(item.selection.productId))
      .length;
  const allOnPageSelected =
    pageSelectableCount > 0 && selectedOnPageCount === pageSelectableCount;
  const partialOnPageSelected =
    selectedOnPageCount > 0 && selectedOnPageCount < pageSelectableCount;

  const paginationData: PaginationData = {
    current_page: data?.current_page ?? page,
    last_page: data?.last_page ?? 1,
    from: data?.from ?? 0,
    total: data?.total ?? 0,
    has_more_pages: data?.has_more_pages ?? false,
  };

  const toggleExpand = (productId: number) => {
    setExpandedProductIds((previous) => {
      const next = new Set(previous);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  };

  const toggleProduct = (product: ProductSelection, checked: boolean) => {
    setSelection((previous) => applyProductToggle(previous, product, checked));
  };

  const toggleVariants = (
    product: ProductSelection,
    variants: ProductVariantSelection[],
    checked: boolean,
  ) => {
    setSelection((previous) =>
      applyVariantToggle(previous, product, variants, checked),
    );
  };

  const toggleAllOnPage = (checked: boolean) => {
    setSelection((previous) =>
      pickerItems.reduce(
        (accumulator, item) =>
          selectVariants
            ? applyVariantToggle(
              accumulator,
              item.selection,
              item.selection.variants,
              checked,
            )
            : applyProductToggle(accumulator, item.selection, checked),
        previous,
      ),
    );
  };

  const handleAdd = () => {
    onAdd(Array.from(selection.values()));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent cssOverride={{ width: '860px' }}>
        <DialogHeader>
          <Flex gap={2} align="center">
            <BoxIcon />
            <DialogTitle>{__('Select products', 'kirki-ecommerce')}</DialogTitle>
          </Flex>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody cssOverride={{ height: '80vh' }}>
          <Flex gap={2}>
            <div style={{ flex: 1 }}>
              <Searchbox
                placeholder={__('Search..', 'kirki-ecommerce')}
                onChange={(value) => {
                  setSearch(String(value));
                  setPage(1);
                }}
              />
            </div>
            <ProductFilterPopup
              value={filters}
              onApply={(next) => {
                setFilters(next);
                setPage(1);
              }}
            >
              <Button variant="outline">
                <ListFilter />
                {__('Filter', 'kirki-ecommerce')}
              </Button>
            </ProductFilterPopup>
          </Flex>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onlyCheckbox>
                  <Checkbox
                    checked={allOnPageSelected}
                    isPartialChecked={partialOnPageSelected}
                    disabled={pageSelectableCount === 0}
                    onCheckedChange={(checked) =>
                      toggleAllOnPage(checked === true)
                    }
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
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Spinner />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && products.length === 0 && (
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
                  expanded={expandedProductIds.has(item.product.id)}
                  onToggleExpand={() => toggleExpand(item.product.id)}
                  selectVariants={selectVariants}
                  isProductSelected={selectedProductIds.has(item.product.id)}
                  selectedVariantIds={selectedVariantIds}
                  onToggleProduct={(checked) =>
                    toggleProduct(item.selection, checked)
                  }
                  onToggleVariants={(variants, checked) =>
                    toggleVariants(item.selection, variants, checked)
                  }
                />
              ))}
            </TableBody>
          </Table>
        </DialogBody>
        <DialogFooter cssOverride={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Pagination data={paginationData} onChange={setPage} />
          <Flex gap={2} align="center">
            <Text variant="small" color="secondary">
              {sprintf(
                _n('%d selected', '%d selected', selectedCount, 'kirki-ecommerce'),
                selectedCount,
              )}
            </Text>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              {__('Done', 'kirki-ecommerce')}
            </Button>
          </Flex>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

SelectProductsDialog.displayName = 'SelectProductsDialog';

export default SelectProductsDialog;
