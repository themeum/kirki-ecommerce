import { useCallback, useState } from 'react';

type MarkListItem = {
  id: string | number;
};

type MarkListData = {
  total?: number;
  results?: MarkListItem[];
};

type UseMarkListParams = {
  data: MarkListData;
};

type SelectedItem = string | number;

const useMarkList = ({ data }: UseMarkListParams) => {
  const { total, results = [] } = data;
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemCount, setItemCount] = useState(0);

  const checkIfAnyIdExist = () => {
    const selectedIdSet = new Set(selectedItems);

    const hasAny = results.some((item) => selectedIdSet.has(item.id));

    return hasAny;
  };

  const checkIfAllIdExist = () => {
    const selectedIdSet = new Set(selectedItems);

    const hasAll =
      selectedItems.includes('*') ||
      results.every((item) => selectedIdSet.has(item.id));

    return hasAll;
  };

  const handleSelectAll = () => {
    setSelectedItems(['*']);
    setItemCount(total ?? 0);
  };

  const handleAllCheckboxClick = (_value?: unknown) => {
    let arr: SelectedItem[] = [];
    const isAllSelected = checkIfAllIdExist();
    if (!isAllSelected) {
      arr = [...results.map((item) => item.id), ...selectedItems];
    }
    arr = arr.filter((item) => item !== '*');
    arr = [...new Set(arr)];
    setSelectedItems(arr);
    setItemCount(arr.length);
  };

  const handleSingleCheckboxClick = (value: unknown, id: SelectedItem) => {
    let arr: SelectedItem[] = [...selectedItems];
    if (value) {
      arr = [...selectedItems, id];
    } else {
      if (selectedItems.includes('*')) {
        arr = [...results.map((item) => item.id)];
        arr = arr.filter((item) => item !== id);
      } else {
        arr = selectedItems.filter((item) => item !== id);
      }
    }
    arr = arr.filter((item) => item !== '*');

    arr = [...new Set(arr)];

    setSelectedItems(arr);
    setItemCount(arr.length);
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
    setItemCount(0);
  };

  const isSelected = useCallback(
    (id: SelectedItem) => {
      let b = selectedItems.includes(id) || selectedItems.includes('*');
      if (id === '*' && selectedItems.length > 0) {
        b = checkIfAllIdExist();
      }
      return b;
    },
    [selectedItems, results],
  );

  const isPartiallySelected = useCallback(
    (id: SelectedItem) => {
      let b = selectedItems.length > 0 && !selectedItems.includes('*');
      if (id === '*' && selectedItems.length > 0) {
        b = checkIfAnyIdExist() && !checkIfAllIdExist();
      }
      return b;
    },
    [selectedItems, results],
  );

  return {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    handleClearSelection,
    isSelected,
    isPartiallySelected,
    selectedItems,
    itemCount,
  };
};

export default useMarkList;
