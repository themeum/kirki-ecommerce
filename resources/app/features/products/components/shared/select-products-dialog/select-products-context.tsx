import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  applyProductToggle,
  applyVariantToggle,
  getRangeRows,
  getRowKey,
  getSelectedCount,
  getSelectionCounts,
} from '@/features/products/components/shared/select-products-dialog/selection-helpers';
import type {
  ProductPickerItem,
  ProductSelection,
  ProductVariantSelection,
  SelectProductsMode,
} from '@/features/products/components/shared/select-products-dialog/types';

type SelectProductsState = {
  mode: SelectProductsMode;
  isLoading: boolean;
  pickerItems: ProductPickerItem[];
  expandedProductIds: Set<number>;
  selection: Map<number, ProductSelection>;
  lockedVariantIds: Set<number>;
  allOnPageSelected: boolean;
  partialOnPageSelected: boolean;
  pageSelectableCount: number;
  selectedCount: number;
};

type SelectProductsActions = {
  toggleExpand: (productId: number) => void;
  toggleProduct: (product: ProductSelection, checked: boolean) => void;
  toggleVariants: (
    product: ProductSelection,
    variants: ProductVariantSelection[],
    checked: boolean,
  ) => void;
  toggleAllOnPage: (checked: boolean) => void;
  toggleRange: (
    item: ProductPickerItem,
    checked: boolean,
    variant?: ProductVariantSelection,
  ) => void;
  setAnchor: (item: ProductPickerItem, variant?: ProductVariantSelection) => void;
  getSelections: () => ProductSelection[];
};

type SelectProductsProviderProps = {
  children: ReactNode;
  mode: SelectProductsMode;
  selectedProducts: ProductSelection[];
  pickerItems: ProductPickerItem[];
  isLoading: boolean;
  expandAll?: boolean;
};

const SelectProductsStateContext = createContext<SelectProductsState | null>(null);
const SelectProductsActionsContext = createContext<SelectProductsActions | null>(null);

const SelectProductsProvider = ({
  children,
  mode,
  selectedProducts,
  pickerItems,
  isLoading,
  expandAll = false,
}: SelectProductsProviderProps) => {
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set());
  const [expandedPickerItems, setExpandedPickerItems] = useState<ProductPickerItem[] | null>(null);
  const [selection, setSelection] = useState<Map<number, ProductSelection>>(
    () => new Map(selectedProducts.map((product) => [product.productId, product])),
  );
  const [lockedVariantIds] = useState<Set<number>>(
    () =>
      new Set(
        mode === 'order'
          ? selectedProducts.flatMap((product) =>
              product.variants.map((variant) => variant.variantId),
            )
          : [],
      ),
  );
  const anchorRowKey = useRef<string | null>(null);

  const latest = useRef({ mode, pickerItems, expandedProductIds, selection });
  latest.current = { mode, pickerItems, expandedProductIds, selection };

  if (expandAll && pickerItems.length > 0 && pickerItems !== expandedPickerItems) {
    setExpandedPickerItems(pickerItems);
    setExpandedProductIds(new Set(pickerItems.map((item) => item.product.id)));
  }

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

  const state = useMemo<SelectProductsState>(() => {
    const { selectableOnPage, selectedOnPage } = getSelectionCounts({
      mode,
      items: pickerItems,
      selectedProductIds,
      selectedVariantIds,
      lockedVariantIds,
    });

    return {
      mode,
      isLoading,
      pickerItems,
      expandedProductIds,
      selection,
      lockedVariantIds,
      allOnPageSelected: selectableOnPage > 0 && selectedOnPage === selectableOnPage,
      partialOnPageSelected: selectedOnPage > 0 && selectedOnPage < selectableOnPage,
      pageSelectableCount: selectableOnPage,
      selectedCount: getSelectedCount(
        mode,
        selectedProductIds,
        selectedVariantIds,
        lockedVariantIds,
      ),
    };
  }, [
    mode,
    isLoading,
    pickerItems,
    expandedProductIds,
    selection,
    selectedProductIds,
    selectedVariantIds,
    lockedVariantIds,
  ]);

  const toggleExpand = useCallback((productId: number) => {
    setExpandedProductIds((previous) => {
      const next = new Set(previous);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  }, []);

  const toggleProduct = useCallback((product: ProductSelection, checked: boolean) => {
    setSelection((previous) => applyProductToggle(previous, product, checked));
  }, []);

  const toggleVariants = useCallback(
    (product: ProductSelection, variants: ProductVariantSelection[], checked: boolean) => {
      setSelection((previous) =>
        applyVariantToggle(previous, product, variants, checked, lockedVariantIds),
      );
    },
    [lockedVariantIds],
  );

  const toggleAllOnPage = useCallback(
    (checked: boolean) => {
      const { mode: currentMode, pickerItems: currentItems } = latest.current;

      setSelection((previous) =>
        currentItems.reduce(
          (accumulator, item) =>
            currentMode === 'order'
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
    },
    [lockedVariantIds],
  );

  const setAnchor = useCallback((item: ProductPickerItem, variant?: ProductVariantSelection) => {
    anchorRowKey.current = getRowKey(item.product.id, variant);
  }, []);

  const toggleRange = useCallback(
    (item: ProductPickerItem, checked: boolean, variant?: ProductVariantSelection) => {
      const {
        mode: currentMode,
        pickerItems: currentItems,
        expandedProductIds: expanded,
      } = latest.current;
      const isOrderMode = currentMode === 'order';

      getRangeRows({
        items: currentItems,
        expandedProductIds: expanded,
        isOrderMode,
        anchorKey: anchorRowKey.current,
        target: { pickerItem: item, variant },
      }).forEach((row) => {
        if (row.variant) {
          toggleVariants(row.pickerItem.selection, [row.variant], checked);
        } else if (isOrderMode) {
          toggleVariants(row.pickerItem.selection, row.pickerItem.selection.variants, checked);
        } else {
          toggleProduct(row.pickerItem.selection, checked);
        }
      });
    },
    [toggleVariants, toggleProduct],
  );

  const getSelections = useCallback(() => Array.from(latest.current.selection.values()), []);

  const actions = useMemo<SelectProductsActions>(
    () => ({
      toggleExpand,
      toggleProduct,
      toggleVariants,
      toggleAllOnPage,
      toggleRange,
      setAnchor,
      getSelections,
    }),
    [
      toggleExpand,
      toggleProduct,
      toggleVariants,
      toggleAllOnPage,
      toggleRange,
      setAnchor,
      getSelections,
    ],
  );

  return (
    <SelectProductsActionsContext.Provider value={actions}>
      <SelectProductsStateContext.Provider value={state}>
        {children}
      </SelectProductsStateContext.Provider>
    </SelectProductsActionsContext.Provider>
  );
};

SelectProductsProvider.displayName = 'SelectProductsProvider';

const useSelectProductsState = () => {
  const context = useContext(SelectProductsStateContext);

  if (!context) {
    throw new Error('useSelectProductsState must be used within SelectProductsProvider');
  }

  return context;
};

const useSelectProductsActions = () => {
  const context = useContext(SelectProductsActionsContext);

  if (!context) {
    throw new Error('useSelectProductsActions must be used within SelectProductsProvider');
  }

  return context;
};

export { SelectProductsProvider, useSelectProductsActions, useSelectProductsState };
