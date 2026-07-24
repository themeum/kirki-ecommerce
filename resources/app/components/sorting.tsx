import type { ReactNode } from 'react';

import { ArrowDownUpFilled } from '@/icons';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
      return theme.colors.background.fillBrand;
    }
    return theme.colors.icon.secondary;
  };

  return (
    <Flex
      gap={4}
      css={[
        styles.base,
        sortable && styles.sortable,
        sortable && isActive() && styles.active,
      ]}
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

const styles = {
  base: scoped({
    alignItems: 'center',
  }),
  sortable: scoped({
    cursor: 'pointer',
  }),
  active: scoped({
    color: theme.colors.background.fillBrand,
  }),
};
