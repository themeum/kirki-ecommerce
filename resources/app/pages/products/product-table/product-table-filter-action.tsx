import { CLASS_PREFIX } from '@/conf';
import { useListParams } from '@/hooks';
import Button from '@/molecules/button';
import Capsule from '@/molecules/capsule';
import Flex from '@/molecules/flex';
import { makeSuggestionList } from '@/pages/utils';
import { useBrandsQuery } from '@/services/brand';
import { useCategoriesQuery } from '@/services/category';
import { useCollectionsQuery } from '@/services/collection';
import type { SuggestionOption } from '@/types';
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

const PRODUCT_FILTER_KEYS = [
  'category_ids',
  'brand_ids',
  'collection_ids',
  'status',
  'stock_status',
] as const;

type ProductFilterKey = (typeof PRODUCT_FILTER_KEYS)[number];

const ProductTableFilterAction = () => {
  const { params, setParam, setParams } = useListParams({
    defaults: {
      search: '',
      sort_by: 'title',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });

  const { data: brandsData } = useBrandsQuery({ limit: -1 });
  const { data: categoriesData } = useCategoriesQuery({ limit: -1 });
  const { data: collectionsData } = useCollectionsQuery({ limit: -1 });

  const brandOptions = makeSuggestionList(brandsData?.results || [], []);
  const categoryOptions = makeSuggestionList(categoriesData?.results || [], []);
  const collectionOptions = makeSuggestionList(collectionsData?.results || [], []);

  const filterOptionsMap: Record<ProductFilterKey, SuggestionOption[]> = {
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
    return '';
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
    setParams({
      category_ids: undefined,
      brand_ids: undefined,
      collection_ids: undefined,
      status: undefined,
      stock_status: undefined,
    });
  };

  return (
    <Flex gap={12} className={`${CLASS_PREFIX}-filter-action-bar`}>
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
      <Button
        text={__('Clear All', 'kirki-ecommerce')}
        onClick={handleClearAll}
        type="link"
        size="small"
      />
    </Flex>
  );
};

ProductTableFilterAction.displayName = 'ProductTableFilterAction';

export default ProductTableFilterAction;
