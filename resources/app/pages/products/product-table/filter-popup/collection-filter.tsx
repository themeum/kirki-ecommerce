import { useEffect, useState } from 'react';

import { Select } from '@/molecules/select';
import { useCollectionsQuery } from '@/services/collection';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type FilterObject = {
  collection_ids?: number | undefined;
};

type CollectionFilterProps = {
  filterObject: FilterObject;
  onChange?: (val: string | number | Array<string | number>) => void;
};

const CollectionFilter = ({
  filterObject,
  onChange = () => {},
}: CollectionFilterProps) => {
  const { data: collectionData } = useCollectionsQuery({ limit: -1 });
  const [collectionOptions, setCollectionOptions] = useState<SelectOption[]>([]);

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
      value={filterObject?.collection_ids || 'all'}
      optionsArray={[
        { value: 'all', title: __('All', 'kirki-ecommerce') },
        ...(collectionOptions || []),
      ]}
      onChange={(val) => onChange(val)}
    />
  );
};

CollectionFilter.displayName = 'CollectionFilter';

export default CollectionFilter;
