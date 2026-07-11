import { useEffect, useState } from 'react';

import { useGetListAPI } from '@/hooks';
import { Select } from '@/molecules/select';
import { getCollectionsAPI } from '@/store/collectionsSlice';
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

type CollectionFilterProps = {
  filterObject: ProductFilterState;
  onChange?: (val: string | number | Array<string | number>) => void;
};

const CollectionFilter = ({
  filterObject,
  onChange = () => {},
}: CollectionFilterProps) => {
  const { data: collectionData } = useAppSelector((state) => state.collections);
  useGetListAPI({
    reducerName: 'collections',
    limit: -1,
    apiCallBack: getCollectionsAPI,
  });
  const [collectionOptions, setCollectionOptions] = useState<SelectOption[]>(
    [],
  );

  useEffect(() => {
    const suggestionList = collectionData?.results.map((item) => ({
      ...item,
      value: item.id,
      title: item.title,
    }));
    setCollectionOptions(suggestionList || []);
  }, [collectionData]);

  return (
    <Select
      label={__('Collection', 'kirki-ecommerce')}
      value={filterObject?.collection_id || 'all'}
      optionsArray={[
        { value: 'all', title: __('All', 'kirki-ecommerce') },
        ...(collectionOptions || []),
      ]}
      onChange={(val) => onChange(val)}
    />
  );
};

export default CollectionFilter;
