import { useEffect, useState } from 'react';

import { CLASS_PREFIX } from '@/conf';
import Button from '@/molecules/button';
import Capsule from '@/molecules/capsule';
import Flex from '@/molecules/flex';
import { makeSuggestionList } from '@/pages/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setKeyValue } from '@/store/productsSlice';
import type { SuggestionOption } from '@/types';
import { __ } from '@/wpi18n';

type ProductFilterState = {
  category_ids?: number[] | string;
  status?: string;
  inventory_type?: string;
  collection_id?: string | number;
  brand_id?: string | number;
  [key: string]: unknown;
};

type FilterValue = string | number | Array<string | number>;

const statusOptions: SuggestionOption[] = [
  { value: 'published', title: __('Published', 'kirki-ecommerce') },
  { value: 'draft', title: __('Draft', 'kirki-ecommerce') },
];

const inventoryOptions: SuggestionOption[] = [
  { value: 'in_stock', title: __('In stock', 'kirki-ecommerce') },
  { value: 'out_of_stock', title: __('Out of stock', 'kirki-ecommerce') },
];

const ProductTableFilterAction = () => {
  const dispatch = useAppDispatch();
  const { filter: filterData } = useAppSelector((state) => state.products);
  const { results: brandData } = useAppSelector((state) => state.brands?.data!);
  const { results: categoriesData } = useAppSelector(
    (state) => state.categories?.data!,
  );
  const { results: collectionData } = useAppSelector(
    (state) => state.collections?.data!,
  );
  const [filterObject, setFilterObject] = useState<ProductFilterState>({});

  const brandOptions = makeSuggestionList(brandData, []);
  const categoryOptions = makeSuggestionList(categoriesData, []);
  const collectionOptions = makeSuggestionList(collectionData, []);

  const filterOptionsMap: Record<string, SuggestionOption[]> = {
    category_ids: categoryOptions,
    status: statusOptions,
    inventory_type: inventoryOptions,
    collection_id: collectionOptions,
    brand_id: brandOptions,
  };

  useEffect(() => {
    const { category_ids, status } = filterData as ProductFilterState;
    let formattedFilter: ProductFilterState = {
      ...(filterData as ProductFilterState),
    };
    if (status) {
      if ((filterData as ProductFilterState).status === '') {
        formattedFilter = { ...formattedFilter, status: 'all' };
      }
    }
    if (category_ids) {
      const idArray = String(category_ids)
        .split(',')
        .map(Number);
      formattedFilter = { ...formattedFilter, category_ids: idArray };
    }
    setFilterObject(formattedFilter);
  }, [filterData]);

  const handleFilterChange = (val: FilterValue, filterName: string) => {
    const newFilter = { ...filterObject, [filterName]: val };
    setFilterObject(newFilter);
    handleOnApplyFilter(newFilter);
  };

  const handleOnApplyFilter = (filter: ProductFilterState) => {
    const formattedData: ProductFilterState = { ...filter };
    if (filter?.category_ids) {
      if (Array.isArray(filter.category_ids) && filter.category_ids.length > 0) {
        formattedData.category_ids = filter.category_ids.join(',');
      }
    }
    if (filter?.status === 'all') {
      delete formattedData.status;
    }
    dispatch(setKeyValue({ key: 'filter', value: formattedData }));
  };

  const handleClearSingleFilter = (filterName: string) => {
    const newFilter = { ...filterObject };
    delete newFilter[filterName];
    setFilterObject(newFilter);
    handleOnApplyFilter(newFilter);
  };

  const handleClearAll = () => {
    dispatch(setKeyValue({ key: 'filter', value: {} }));
  };

  return (
    <Flex gap={12} className={`${CLASS_PREFIX}-filter-action-bar`}>
      {Object.keys(filterData || {}).map((item) => (
        <Capsule
          key={item}
          uniqueKey={item}
          optionsArray={filterOptionsMap[item]}
          value={filterObject[item] as FilterValue}
          onValueChange={(val) => handleFilterChange(val, item)}
          onClearItem={() => handleClearSingleFilter(item)}
          multiple={item === 'category_ids'}
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

export default ProductTableFilterAction;
