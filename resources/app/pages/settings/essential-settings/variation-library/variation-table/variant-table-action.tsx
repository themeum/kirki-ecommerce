import { useState, type Dispatch, type SetStateAction } from 'react';

import Button from '@/components/ui/button';
import { ArrowDownUp } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
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
        <Button variant="outline" size="icon" onClick={handleSortChange}>
          <ArrowDownUp />
        </Button>
      </ActionGroup>
    </Flex>
  );
};

VariantTableAction.displayName = 'VariantTableAction';

export default VariantTableAction;
