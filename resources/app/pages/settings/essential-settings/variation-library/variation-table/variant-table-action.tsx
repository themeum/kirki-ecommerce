import { useState, type Dispatch, type SetStateAction } from 'react';

import { ArrowDownUp } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import type { AttributeValue, SortOrder } from '@/types';

import { getSortedList } from '@/pages/settings/utils';

type VariantTableActionProps = {
  dataList: AttributeValue[];
  updateDataList: Dispatch<SetStateAction<AttributeValue[]>>;
  setSearchValue: Dispatch<SetStateAction<string>>;
  searchValue: string;
};

const VariantTableAction = ({
  dataList,
  updateDataList,
  setSearchValue,
  searchValue,
}: VariantTableActionProps) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSortChange = () => {
    const nextOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    const sortedList = getSortedList({
      data: dataList,
      key: 'value',
      order: nextOrder,
    }) as AttributeValue[];

    setSortOrder(nextOrder);
    updateDataList(sortedList);
  };

  return (
    <Flex style={{ padding: 'var(--decom-spacing-4) var(--decom-spacing-5)' }}>
      <div style={{ width: '160px' }}>
        <Searchbox
          onChange={(value) => setSearchValue(value as string)}
          value={searchValue}
        />
      </div>
      <ActionGroup>
        <Button
          type="outlined"
          size="small"
          icon={<ArrowDownUp />}
          onClick={handleSortChange}
        />
      </ActionGroup>
    </Flex>
  );
};

VariantTableAction.displayName = 'VariantTableAction';

export default VariantTableAction;
