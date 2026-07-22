import type { CSSProperties, ReactNode } from 'react';

import { ArrowDownUpFilled } from '@/icons';
import Flex from '@/components/ui/flex';
import type { SortOrder } from '@/types';

type SortableConfig = {
  sort_by: string;
  activeSortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (sortBy: string, sortOrder: SortOrder) => void;
};

type SortingData = {
  title: ReactNode;
  sortable?: SortableConfig;
};

type SortingProps = {
  data: SortingData;
};

const Sorting = ({ data }: SortingProps) => {
  const { title, sortable } = data;
  const { sort_by, activeSortBy, sortOrder, onSort } = sortable || {};

  const handleSorting = () => {
    if (!onSort || !sort_by) {
      return;
    }
    const nextOrder: SortOrder =
      activeSortBy === sort_by && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(sort_by, nextOrder);
  };

  const isActive = () => {
    if (activeSortBy === sort_by) {
      return true;
    }
    return false;
  };

  const getArrowColor = (type = 'top') => {
    if (
      isActive() &&
      ((type === 'top' && sortOrder === 'desc') ||
        (type === 'bottom' && sortOrder === 'asc'))
    ) {
      return '#5641f3';
    } else {
      return '#5f5d69';
    }
  };

  const styleObj: CSSProperties = {};
  if (sortable) {
    if (isActive()) {
      styleObj.color = '#5641f3';
    }
    styleObj.cursor = 'pointer';
  }
  return (
    <Flex
      gap={4}
      style={{ alignItems: 'center', ...styleObj }}
      onClick={handleSorting}
    >
      {title}
      {sortable && (
        <ArrowDownUpFilled
          top={getArrowColor('top')}
          bottom={getArrowColor('bottom')}
        />
      )}
    </Flex>
  );
};

Sorting.displayName = 'Sorting';

export default Sorting;
export type { SortableConfig, SortingData };
