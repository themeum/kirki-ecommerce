import { useMemo, useState } from 'react';

import Pagination from '@/components/pagination';
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
import ProductFilterPopup, { type ProductFilterValue } from '@/pages/orders/order-create/components/product/product-filter-popup';
import ProductPickerRow from '@/pages/orders/order-create/components/product/product-picker-row';
import { getVariantLabel } from '@/pages/orders/order-create/config/variant-label';
import type {
  OrderRowDisplay,
  ProductPickerItem,
} from '@/pages/orders/order-create/types';
import { useProductsQuery } from '@/services/product';
import type { PaginationData, ProductListItem } from '@/types';
import { __, _n, sprintf } from '@/wpi18n';

type SelectProductsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (items: OrderRowDisplay[]) => void;
  selectedLines: OrderRowDisplay[];
};

const PAGE_SIZE = 8;

const buildProductRows = (product: ProductListItem): ProductPickerItem[] =>
  product.variants.reduce<ProductPickerItem[]>((rows, variant) => {
    if (!variant.id) {
      return rows;
    }

    const label = getVariantLabel(product.attributes, variant);

    rows.push({
      label: label || variant.sku || __('Default', 'kirki-ecommerce'),
      inStock: variant.in_stock,
      row: {
        variantId: variant.id,
        productTitle: product.title,
        variantLabel: label || undefined,
        thumbnail: variant.media?.url ?? product.image ?? null,
        regularPrice: variant.price_object,
        salePrice: variant.sale_price_object,
      },
    });

    return rows;
  }, []);

const SelectProductsDialog = ({
  open,
  onOpenChange,
  onAdd,
  selectedLines,
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
  const [selection, setSelection] = useState<Map<number, OrderRowDisplay>>(
    () => new Map(selectedLines.map((line) => [line.variantId, line])),
  );

  const { data, isLoading } = useProductsQuery({
    search,
    page,
    limit: PAGE_SIZE,
    sort_by: 'title',
    sort_order: 'asc',
    status: 'published',
    category_ids: filters.category_ids.length ? filters.category_ids : undefined,
    stock_status: filters.stock_status || undefined,
    collection_ids: filters.collection_ids ? [filters.collection_ids] : undefined,
    brand_ids: filters.brand_ids ? [filters.brand_ids] : undefined,
  }, open);

  const products = data?.results ?? [];
  const productRows = useMemo(
    () =>
      new Map(products.map((product) => [product.id, buildProductRows(product)])),
    [products],
  );
  const pageRows = useMemo(
    () => products.flatMap(
      (product) => productRows.get(product.id)?.map((line) => line.row) ?? [],
    ),
    [productRows, products],
  );
  const selectedOnPageCount = pageRows.filter((line) =>
    selection.has(line.variantId),
  ).length;
  const allOnPageSelected =
    pageRows.length > 0 && selectedOnPageCount === pageRows.length;
  const partialOnPageSelected =
    selectedOnPageCount > 0 && selectedOnPageCount < pageRows.length;

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

  const toggleRows = (rows: OrderRowDisplay[], checked: boolean) => {
    setSelection((previous) => {
      const next = new Map(previous);

      rows.forEach((row) => {
        if (checked) {
          next.set(row.variantId, row);
          return;
        }

        next.delete(row.variantId);
      });

      return next;
    });
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
        <DialogBody>
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
                    disabled={pageRows.length === 0}
                    onCheckedChange={(checked) =>
                      toggleRows(pageRows, checked === true)
                    }
                  />
                </TableHead>
                <TableHead>{__('Variants', 'kirki-ecommerce')}</TableHead>
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
              {products.map((product) => (
                <ProductPickerRow
                  key={product.id}
                  product={product}
                  variants={productRows.get(product.id) ?? []}
                  expanded={expandedProductIds.has(product.id)}
                  onToggleExpand={() => toggleExpand(product.id)}
                  selectedVariantIds={new Set(selection.keys())}
                  onToggleRows={toggleRows}
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
                _n('%d selected', '%d selected', selection.size, 'kirki-ecommerce'),
                selection.size,
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
