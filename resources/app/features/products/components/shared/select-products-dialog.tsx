import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/ui/button';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPageSelect,
  PaginationPrevious,
} from '@/components/ui/pagination';
import Searchbox from '@/components/ui/searchbox';
import Text from '@/components/ui/text';
import { buildProductSelection } from '@/features/products/components/shared/select-products-dialog/build-selection';
import ProductFilterPopup, {
  type ProductFilterValue,
} from '@/features/products/components/shared/select-products-dialog/product-filter-popup';
import ProductTable from '@/features/products/components/shared/select-products-dialog/product-table';
import {
  applyProductToggle,
  applyVariantToggle,
  getSelectedCount,
  getSelectionCounts,
} from '@/features/products/components/shared/select-products-dialog/selection-helpers';
import type {
  ProductSelection,
  ProductVariantSelection,
  SelectProductsMode,
} from '@/features/products/components/shared/select-products-dialog/types';
import { useProductsWithVariantsQuery } from '@/features/products/services/product';
import { BoxIcon, ListFilter } from '@/icons';
import { theme } from '@/theme';
import { ELLIPSIS, getPageItems } from '@/utils/pagination';
import { __, _n, sprintf } from '@/wpi18n';

type SelectProductsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (selections: ProductSelection[]) => void;
  selectedProducts: ProductSelection[];
  mode: SelectProductsMode;
  expandAll?: boolean;
};

type SelectProductsDialogBodyProps = Omit<SelectProductsDialogProps, 'open'>;

const LIMIT = 12;

const SelectProductsDialogBody = ({
  onOpenChange,
  onAdd,
  selectedProducts,
  mode,
  expandAll = false,
}: SelectProductsDialogBodyProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ProductFilterValue>({
    category_ids: [],
    status: 'all',
    availability_status: '',
    collection_id: undefined,
    brand_id: undefined,
  });
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set());
  const [selection, setSelection] = useState<Map<number, ProductSelection>>(
    () => new Map(selectedProducts.map((product) => [product.productId, product])),
  );
  const [lockedVariantIds] = useState<Set<number>>(
    () =>
      new Set(
        mode === 'order'
          ? selectedProducts.flatMap((product) => product.variants.map((variant) => variant.variantId))
          : [],
      ),
  );

  const { data, isFetching, isLoading } = useProductsWithVariantsQuery({
    search,
    page,
    limit: LIMIT,
    sort_by: 'title',
    sort_order: 'asc',
    status: filters.status && filters.status !== 'all' ? filters.status : 'published',
    category_ids: filters.category_ids.length ? filters.category_ids : undefined,
    availability_status:
      filters.availability_status && filters.availability_status !== 'all'
        ? filters.availability_status
        : undefined,
    collection_id: filters.collection_id,
    brand_id: filters.brand_id,
  });

  const loading = isFetching || isLoading;

  const products = useMemo(() => data?.results ?? [], [data?.results]);

  useEffect(() => {
    if (!expandAll || products.length === 0) {
      return;
    }
    setExpandedProductIds(new Set(products.map((product) => product.id)));
  }, [expandAll, products]);

  const pickerItems = useMemo(
    () =>
      products.map((product) => ({
        product,
        selection: buildProductSelection(product),
      })),
    [products],
  );

  const selectedProductIds = useMemo(() => new Set(selection.keys()), [selection]);
  const selectedVariantIds = useMemo(
    () =>
      new Set(
        Array.from(selection.values()).flatMap((product) =>
          product.variants.map((variant) => variant.variantId),
        ),
      ),
    [selection],
  );
  const selectedCount = getSelectedCount(
    mode,
    selectedProductIds,
    selectedVariantIds,
    lockedVariantIds,
  );

  const { selectableOnPage: pageSelectableCount, selectedOnPage: selectedOnPageCount } =
    getSelectionCounts({
      mode,
      items: pickerItems,
      selectedProductIds,
      selectedVariantIds,
      lockedVariantIds,
    });
  const allOnPageSelected = pageSelectableCount > 0 && selectedOnPageCount === pageSelectableCount;
  const partialOnPageSelected =
    selectedOnPageCount > 0 && selectedOnPageCount < pageSelectableCount;

  const totalPages = data?.last_page ?? 1;
  const totalResults = data?.total ?? 0;
  const pageItems = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);

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
      applyVariantToggle(previous, product, variants, checked, lockedVariantIds),
    );
  };

  const toggleAllOnPage = (checked: boolean) => {
    setSelection((previous) =>
      pickerItems.reduce(
        (accumulator, item) =>
          mode === 'order'
            ? applyVariantToggle(
                accumulator,
                item.selection,
                item.selection.variants,
                checked,
                lockedVariantIds,
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
    <>
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

        <ProductTable
          isLoading={loading}
          pickerItems={pickerItems}
          mode={mode}
          allOnPageSelected={allOnPageSelected}
          partialOnPageSelected={partialOnPageSelected}
          pageSelectableCount={pageSelectableCount}
          onToggleAllOnPage={toggleAllOnPage}
          expandedProductIds={expandedProductIds}
          onToggleExpand={toggleExpand}
          selectedProductIds={selectedProductIds}
          selectedVariantIds={selectedVariantIds}
          lockedVariantIds={lockedVariantIds}
          onToggleProduct={toggleProduct}
          onToggleVariants={toggleVariants}
        />
      </DialogBody>
      <DialogFooter
        cssOverride={{
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${theme.spacing[0]} ${theme.spacing[6]} ${theme.spacing[4]} ${theme.spacing[6]}`,
        }}
      >
        {totalResults > 0 && (
          <Pagination disabled={loading}>
            <Flex align="center" gap={2}>
              <PaginationPageSelect
                currentPage={page}
                totalPages={totalPages}
                onChange={setPage}
              />
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious disabled={page <= 1} onClick={() => setPage(page - 1)} />
                </PaginationItem>
                {pageItems.map((item, index) =>
                  item === ELLIPSIS ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink isActive={item === page} onClick={() => setPage(item)}>
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext disabled={page >= totalPages} onClick={() => setPage(page + 1)} />
                </PaginationItem>
              </PaginationContent>
            </Flex>
          </Pagination>
        )}
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
    </>
  );
};

SelectProductsDialogBody.displayName = 'SelectProductsDialogBody';

const SelectProductsDialog = ({ open, onOpenChange, ...bodyProps }: SelectProductsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent cssOverride={{ width: '860px' }}>
        <SelectProductsDialogBody onOpenChange={onOpenChange} {...bodyProps} />
      </DialogContent>
    </Dialog>
  );
};

SelectProductsDialog.displayName = 'SelectProductsDialog';

export default SelectProductsDialog;
