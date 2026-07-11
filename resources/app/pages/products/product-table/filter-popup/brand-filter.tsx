import { useEffect, useState } from 'react';

import { useGetListAPI } from '@/hooks';
import { Select } from '@/molecules/select';
import { getBrandsAPI } from '@/store/brandsSlice';
import { useAppSelector } from '@/store/hooks';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type ProductFilterState = {
  category_ids?: number[] | string;
  status?: string;
  inventory_type?: string;
  collection_id?: string | number;
  brand_id?: string | number;
  [key: string]: unknown;
};

type BrandFilterProps = {
  filterObject: ProductFilterState;
  onChange?: (val: string | number | Array<string | number>) => void;
};

const BrandFilter = ({
  filterObject,
  onChange = () => {},
}: BrandFilterProps) => {
  const { data: brandData } = useAppSelector((state) => state.brands);
  useGetListAPI({
    reducerName: 'brands',
    page: 1,
    search: '',
    sort_by: 'id',
    sort_order: 'asc',
    limit: -1,
    apiCallBack: getBrandsAPI,
  });
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    const suggestionList = brandData?.results.map((item) => ({
      ...item,
      value: item.id,
      title: item.name,
    }));
    setBrandOptions(suggestionList || []);
  }, [brandData]);
  return (
    <Select
      label={__('Brand', 'kirki-ecommerce')}
      value={filterObject?.brand_id || 'none'}
      optionsArray={brandOptions}
      onChange={(val) => onChange(val)}
    />
  );
};

export default BrandFilter;
