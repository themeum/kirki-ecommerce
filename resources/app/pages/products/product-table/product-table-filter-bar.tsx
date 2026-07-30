import { css } from '@emotion/react';
import { memo } from 'react';

import Button from '@/components/ui/button';
import Capsule from '@/components/ui/capsule';
import Flex from '@/components/ui/flex';
import { useListParamsActions, useListParamsValue } from '@/contexts/list-params-context';
import { makeSuggestionList } from '@/pages/utils';
import { useBrandsQuery } from '@/services/brand';
import { useCategoriesQuery } from '@/services/category';
import { useCollectionsQuery } from '@/services/collection';
import { theme } from '@/theme';
import type { SuggestionOption } from '@/types';
import { ProductListFilter, productListFilterConfig } from '@/types/filters/product';
import { __ } from '@/wpi18n';

type FilterValue = string | number | Array<string | number>;

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

const filterActionBarCss = css({
  flexWrap: 'wrap',
  borderTop: `1px solid ${theme.colors.border.tertiary}`,
  backgroundColor: theme.colors.background.surface,
  padding: theme.spacing[3],
});

const ProductTableFilterBar = memo(() => {
  const params = useListParamsValue<ProductListFilter>();
  const { setParam, setParams } = useListParamsActions<ProductListFilter>();

  const { data: brandsData } = useBrandsQuery({ limit: -1 });
  const { data: categoriesData } = useCategoriesQuery({ limit: -1 });
  const { data: collectionsData } = useCollectionsQuery({ limit: -1 });

  const brandOptions = makeSuggestionList(brandsData?.results || [], []);
  const categoryOptions = makeSuggestionList(categoriesData?.results || [], []);
  const collectionOptions = makeSuggestionList(collectionsData?.results || [], []);

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
    if (key === 'category_ids') {
      return (params.category_ids || []) as FilterValue;
    }
    if (key === 'collection_ids') {
      return (params.collection_ids?.[0] ?? '') as FilterValue;
    }
    if (key === 'brand_ids') {
      return (params.brand_ids?.[0] ?? '') as FilterValue;
    }
    if (key === 'status') {
      return (params.status as FilterValue) ?? '';
    }
    if (key === 'stock_status') {
      return params.stock_status ?? '';
    }
    return (params[key] ?? '') as FilterValue;
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
      ) as Partial<ProductListFilter>,
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
          onValueChange={(val) => handleFilterChange(val as FilterValue, key)}
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
