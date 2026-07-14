import { useEffect, useState } from 'react';

import { Select } from '@/molecules/select';
import { useBrandsQuery } from '@/services/brand';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type FilterObject = {
  brand_ids?: number | undefined;
};

type BrandFilterProps = {
  filterObject: FilterObject;
  onChange?: (val: string | number | Array<string | number>) => void;
};

const BrandFilter = ({
  filterObject,
  onChange = () => {},
}: BrandFilterProps) => {
  const { data: brandData } = useBrandsQuery({ limit: -1 });
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
      value={filterObject?.brand_ids || 'none'}
      optionsArray={brandOptions}
      onChange={(val) => onChange(val)}
    />
  );
};

BrandFilter.displayName = 'BrandFilter';

export default BrandFilter;
