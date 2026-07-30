import type { CSSObject } from '@emotion/react';
import { useState, type Dispatch, type SetStateAction } from 'react';

import Button from '@/components/ui/button';
import { ArrowDownUp } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import type { AttributeValue, SortOrder } from '@/types';

import { theme } from '@/theme';
;

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

const styles = {
  wrapper: ({
    padding: `${theme.spacing[4]} ${theme.spacing[5]}`,
  } satisfies CSSObject),
};
