import { memo } from 'react';

import Button from '@/components/ui/button';
import Capsule from '@/components/ui/capsule';
import Flex from '@/components/ui/flex';
import { useBrandsQuery } from '@/features/brands';
import { useCategoriesQuery } from '@/features/categories';
import { useCollectionsQuery } from '@/features/collections';
import type { ProductListFilter } from '@/features/products';
import { productListFilterConfig, productListOptions } from '@/features/products';
import { useDataTableParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { SuggestionOption } from '@/types/pages/common';
import { makeSuggestionList } from '@/utils/common';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type FilterValue = string | number | (string | number)[];

const statusOptions: SuggestionOption[] = [
  { value: 'published', title: __('Published', 'kirki-ecommerce') },
  { value: 'draft', title: __('Draft', 'kirki-ecommerce') },
];

const stockStatusOptions: SuggestionOption[] = [
  { value: 'in_stock', title: __('In stock', 'kirki-ecommerce') },
  { value: 'out_of_stock', title: __('Out of stock', 'kirki-ecommerce') },
];

const PRODUCT_FILTER_KEYS = productListFilterConfig.keys;

type ProductFilterKey = keyof ProductListFilter;

const filterActionBarCss = defineStyles({
  flexWrap: 'wrap',
  borderTop: `1px solid ${theme.colors.border.tertiary}`,
  backgroundColor: theme.colors.background.surface,
  padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
});

const ProductTableFilterBar = memo(() => {
  const { params, setParam, setParams } = useDataTableParams(productListOptions);

  const { data: brandsData } = useBrandsQuery({ limit: -1 });
  const { data: categoriesData } = useCategoriesQuery({ limit: -1 });
  const { data: collectionsData } = useCollectionsQuery({ limit: -1 });

  const brandOptions = makeSuggestionList(brandsData?.results ?? [], []);
  const categoryOptions = makeSuggestionList(categoriesData?.results ?? [], []);
  const collectionOptions = makeSuggestionList(collectionsData?.results ?? [], []);

  const filterOptionsMap: Partial<Record<ProductFilterKey, SuggestionOption[]>> = {
    category_ids: categoryOptions,
    status: statusOptions,
    stock_status: stockStatusOptions,
    collection_ids: collectionOptions,
    brand_ids: brandOptions,
  };

  const activeFilterKeys = PRODUCT_FILTER_KEYS.filter((key) => {
    const val = params[key];
    if (Array.isArray(val)) {
      return val.length > 0;
    }
    return Boolean(val);
  });

  const getFilterValue = (key: ProductFilterKey): FilterValue => {
    if (!isDefined(params[key])) {
      return '';
    }

    if (key === 'category_ids') {
      return (params.category_ids ?? []);
    }
    if (key === 'collection_ids') {
      return (params.collection_ids?.[0] ?? '');
    }
    if (key === 'brand_ids') {
      return (params.brand_ids?.[0] ?? '');
    }
    if (key === 'status') {
      return (params.status as FilterValue) ?? '';
    }
    if (key === 'stock_status') {
      return params.stock_status ?? '';
    }

    return (params[key] ?? '');
  };

  const handleFilterChange = (val: FilterValue, key: ProductFilterKey) => {
    if (key === 'collection_ids' || key === 'brand_ids') {
      setParam(key, val ? [Number(val)] : undefined);
    } else {
      setParam(key, val || undefined);
    }
  };

  const handleClearSingleFilter = (key: ProductFilterKey) => {
    setParam(key, undefined);
  };

  const handleClearAll = () => {
    setParams(
      Object.fromEntries(
        PRODUCT_FILTER_KEYS.map((key) => [key, undefined]),
      ),
    );
  };

  if (!activeFilterKeys.length) {
    return null;
  }

  return (
    <Flex gap={3} cssOverride={filterActionBarCss}>
      {activeFilterKeys.map((key) => (
        <Capsule
          key={key}
          uniqueKey={key}
          optionsArray={filterOptionsMap[key]}
          value={getFilterValue(key)}
          onValueChange={(val) => handleFilterChange(val, key)}
          onClearItem={() => handleClearSingleFilter(key)}
          multiple={key === 'category_ids'}
        />
      ))}
      <Button variant="link" onClick={handleClearAll}>
        {__('Clear All', 'kirki-ecommerce')}
      </Button>
    </Flex>
  );
});

ProductTableFilterBar.displayName = 'ProductTableFilterBar';

export default ProductTableFilterBar;
