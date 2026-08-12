import { type Dispatch, type SetStateAction, useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { ArrowDownUp } from '@/icons';
import { getSortedList } from '@/pages/settings/utils';
import type { AttributeValue } from '@/schemas/catalog/attribute';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { SortOrder } from '@/types/list-state';

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
    });

    setSortOrder(nextOrder);
    updateDataList(sortedList);
  };

  return (
    <Flex cssOverride={styles.wrapper}>
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

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[5]}`,
  },
});
