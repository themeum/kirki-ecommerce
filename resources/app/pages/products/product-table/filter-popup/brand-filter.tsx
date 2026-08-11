import { useEffect, useState } from 'react';

import Combobox from '@/components/ui/combobox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { useBrandsQuery } from '@/services/brand';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type FilterObject = {
  brand_ids?: number | undefined;
};

type BrandFilterProps = {
  filterObject: FilterObject;
  onChange?: (val: string | number | (string | number)[]) => void;
};

type BrandOption = { label: string; value: string };

const BrandFilter = ({
  filterObject,
  onChange = noop,
}: BrandFilterProps) => {
  const { data: brandData } = useBrandsQuery({ limit: -1 });
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);

  useEffect(() => {
    const suggestionList = brandData?.results.map((item) => ({
      label: item.name,
      value: String(item.id),
    }));
    setBrandOptions(suggestionList ?? []);
  }, [brandData]);

  const handleChange = (value: string | string[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    onChange(nextValue ? Number(nextValue) : '');
  };

  return (
    <Flex direction="column" gap={2}>
      <Label>{__('Brand', 'kirki-ecommerce')}</Label>
      <Combobox
        options={brandOptions}
        value={
          filterObject?.brand_ids !== undefined
            ? String(filterObject.brand_ids)
            : undefined
        }
        onChange={handleChange}
      />
    </Flex>
  );
};

BrandFilter.displayName = 'BrandFilter';

export default BrandFilter;
