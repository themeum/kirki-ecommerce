type BulkEditMode = 'select' | 'fill';

type BulkEditSelectionData = {
  fieldName?: string;
  start: number;
  end: number;
  mode?: BulkEditMode;
  baseIndex?: number;
  lastIndex?: number;
  grabberIndex?: number;
};

type UseBulkEditListParams = {
  selectionData: BulkEditSelectionData | null;
  index: number;
};

type VariantListType = BulkEditMode | 'range';

type BulkEditCellAttrs = {
  'data-bulk-cell'?: 'selected' | 'fill';
  'data-bulk-edge'?: 'base' | 'min' | 'max';
};

const useBulkEditList = ({ selectionData, index }: UseBulkEditListParams) => {
  const getVariantList = (type: VariantListType) => {
    if (!selectionData) {
      return [];
    }

    let min = 0;
    let max = 0;

    if (type === 'fill') {
      if (
        selectionData.baseIndex === undefined ||
        selectionData.lastIndex === undefined
      ) {
        return [];
      }
      min = Math.min(selectionData.baseIndex, selectionData.lastIndex);
      max = Math.max(selectionData.baseIndex, selectionData.lastIndex);
    } else {
      min = Math.min(selectionData.start, selectionData.end);
      max = Math.max(selectionData.start, selectionData.end);
    }

    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  };

  const isSelected = (fieldName: string) => {
    if (selectionData?.fieldName !== fieldName) {
      return false;
    }

    const min = Math.min(selectionData.start, selectionData.end);
    const max = Math.max(selectionData.start, selectionData.end);
    return index >= min && index <= max;
  };

  const isFilled = (fieldName: string) => {
    if (selectionData?.fieldName !== fieldName) {
      return false;
    }
    if (
      selectionData.mode !== 'fill' ||
      selectionData.grabberIndex === undefined ||
      selectionData.lastIndex === undefined
    ) {
      return false;
    }

    const min = Math.min(selectionData.grabberIndex, selectionData.lastIndex);
    const max = Math.max(selectionData.grabberIndex, selectionData.lastIndex);
    return index >= min && index <= max;
  };

  const getActiveState = (fieldName: string): BulkEditCellAttrs => {
    if (isSelected(fieldName)) {
      const attrs: BulkEditCellAttrs = {
        'data-bulk-cell': 'selected',
      };

      if (index === selectionData?.baseIndex) {
        attrs['data-bulk-edge'] = 'base';
      } else if (
        index === selectionData?.end &&
        selectionData?.start <= selectionData?.end
      ) {
        attrs['data-bulk-edge'] = 'min';
      } else if (
        index === selectionData?.end &&
        selectionData?.start >= selectionData?.end
      ) {
        attrs['data-bulk-edge'] = 'max';
      }

      return attrs;
    }

    if (isFilled(fieldName)) {
      const attrs: BulkEditCellAttrs = {
        'data-bulk-cell': 'fill',
      };

      if (
        index === selectionData?.baseIndex ||
        index === selectionData?.grabberIndex
      ) {
        attrs['data-bulk-edge'] = 'base';
      } else if (
        selectionData?.baseIndex !== undefined &&
        selectionData?.lastIndex !== undefined &&
        index === selectionData.lastIndex &&
        selectionData.baseIndex <= selectionData.lastIndex
      ) {
        attrs['data-bulk-edge'] = 'min';
      } else if (
        selectionData?.baseIndex !== undefined &&
        selectionData?.lastIndex !== undefined &&
        index === selectionData.lastIndex &&
        selectionData.baseIndex >= selectionData.lastIndex
      ) {
        attrs['data-bulk-edge'] = 'max';
      }

      return attrs;
    }

    return {};
  };

  return {
    isSelected,
    isFilled,
    getVariantList,
    getActiveState,
  };
};

export default useBulkEditList;

export type { BulkEditCellAttrs, BulkEditSelectionData };
