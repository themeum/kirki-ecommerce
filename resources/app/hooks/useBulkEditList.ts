import { CLASS_PREFIX } from '@/conf';

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
    if (!selectionData || selectionData.fieldName !== fieldName) {
      return false;
    }

    const min = Math.min(selectionData.start, selectionData.end);
    const max = Math.max(selectionData.start, selectionData.end);
    return index >= min && index <= max;
  };

  const isFilled = (fieldName: string) => {
    if (!selectionData || selectionData.fieldName !== fieldName) {
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

  const getActiveState = (fieldName: string) => {
    if (isSelected(fieldName)) {
      let styleClass = `${CLASS_PREFIX}-selected-cell `;
      if (index === selectionData?.baseIndex) {
        styleClass = styleClass + `${CLASS_PREFIX}-base-cell`;
      } else if (
        index === selectionData?.end &&
        selectionData?.start <= selectionData?.end
      ) {
        styleClass = styleClass + `${CLASS_PREFIX}-selected-min `;
      } else if (
        index === selectionData?.end &&
        selectionData?.start >= selectionData?.end
      ) {
        styleClass = styleClass + `${CLASS_PREFIX}-selected-max`;
      }

      return styleClass;
    }

    if (isFilled(fieldName)) {
      let styleClass = `${CLASS_PREFIX}-fill-cell `;
      if (
        index === selectionData?.baseIndex ||
        index === selectionData?.grabberIndex
      ) {
        styleClass = styleClass + `${CLASS_PREFIX}-base-cell`;
      } else if (
        selectionData?.baseIndex !== undefined &&
        selectionData?.lastIndex !== undefined &&
        index === selectionData.lastIndex &&
        selectionData.baseIndex <= selectionData.lastIndex
      ) {
        styleClass = styleClass + `${CLASS_PREFIX}-fill-min `;
      } else if (
        selectionData?.baseIndex !== undefined &&
        selectionData?.lastIndex !== undefined &&
        index === selectionData.lastIndex &&
        selectionData.baseIndex >= selectionData.lastIndex
      ) {
        styleClass = styleClass + `${CLASS_PREFIX}-fill-max`;
      }
      return styleClass;
    }

    return '';
  };

  return {
    isSelected,
    isFilled,
    getVariantList,
    getActiveState,
  };
};

export default useBulkEditList;
