import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import type { CSSProperties, ReactNode } from 'react';

import { ArrowDownUpFilled } from '@/icons';
import Flex from '@/molecules/flex';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/hooks';
import type { SetKeyValuePayload, SortOrder } from '@/types';

type SortableConfig = {
  reducer: string;
  sort_by: string;
  setKeyValue: ActionCreatorWithPayload<SetKeyValuePayload>;
};

type SortingData = {
  title: ReactNode;
  sortable?: SortableConfig;
};

type SortingProps = {
  data: SortingData;
};

type ListSliceState = {
  sort_order?: SortOrder;
  sort_by?: string;
};

const Sorting = ({ data }: SortingProps) => {
  const { title, sortable } = data;
  const { reducer, sort_by, setKeyValue } = sortable || {};
  const dispatch = useAppDispatch();
  const sort_order = useAppSelector((state) => {
    if (!reducer) {
      return undefined;
    }
    const slice = state[reducer as keyof RootState] as ListSliceState | undefined;
    return slice?.sort_order;
  });
  const _sort_by = useAppSelector((state) => {
    if (!reducer) {
      return undefined;
    }
    const slice = state[reducer as keyof RootState] as ListSliceState | undefined;
    return slice?.sort_by;
  });
  const handleSorting = () => {
    if (setKeyValue) {
      if (sort_order === 'asc') {
        dispatch(setKeyValue({ key: 'sort_order', value: 'desc' }));
      } else {
        dispatch(setKeyValue({ key: 'sort_order', value: 'asc' }));
      }
      dispatch(setKeyValue({ key: 'sort_by', value: sort_by }));
    }
  };

  const isActive = () => {
    if (_sort_by === sort_by) {
      return true;
    }
    return false;
  };

  const getArrowColor = (type = 'top') => {
    if (
      isActive() &&
      ((type === 'top' && sort_order === 'desc') ||
        (type === 'bottom' && sort_order === 'asc'))
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

export default Sorting;
