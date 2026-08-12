import { useEffect, useState } from 'react';

import Combobox from '@/components/ui/combobox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { useCollectionsQuery } from '@/services/collection';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type FilterObject = {
  collection_ids?: number | undefined;
};

type CollectionFilterProps = {
  filterObject: FilterObject;
  onChange?: (val: string | number | (string | number)[]) => void;
};

type CollectionOption = { label: string; value: string };

const CollectionFilter = ({
  filterObject,
  onChange = noop,
}: CollectionFilterProps) => {
  const { data: collectionData } = useCollectionsQuery({ limit: -1 });
  const [collectionOptions, setCollectionOptions] = useState<
    CollectionOption[]
  >([]);

  useEffect(() => {
    const suggestionList = collectionData?.results.map((item) => ({
      label: item.title,
      value: String(item.id),
    }));
    setCollectionOptions(suggestionList ?? []);
  }, [collectionData]);

  const options = [
    { label: __('All', 'kirki-ecommerce'), value: 'all' },
    ...collectionOptions,
  ];

  const handleChange = (value: string | string[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    if (!nextValue || nextValue === 'all') {
      onChange(nextValue);
      return;
    }
    onChange(Number(nextValue));
  };

  return (
    <Flex direction="column" gap={2}>
      <Label>{__('Collection', 'kirki-ecommerce')}</Label>
      <Combobox
        options={options}
        value={String(filterObject?.collection_ids ?? 'all')}
        onChange={handleChange}
      />
    </Flex>
  );
};

CollectionFilter.displayName = 'CollectionFilter';

export default CollectionFilter;
