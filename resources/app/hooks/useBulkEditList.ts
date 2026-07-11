import { CLASS_PREFIX } from '@/conf';

type BulkEditSelectionData = {
  fieldName?: string;
  start: number;
  end: number;
  mode?: 'select' | 'fill' | string;
  baseIndex?: number;
  lastIndex?: number;
  grabberIndex?: number;
};

type UseBulkEditListParams = {
  selectionData: BulkEditSelectionData | null;
  index: number;
};

type VariantListType = 'fill' | string;

const useBulkEditList = ({ selectionData, index }: UseBulkEditListParams) => {
  const getVariantList = (type: VariantListType) => {
    let min: number | null = null;
    let max: number | null = null;

    if (type === 'fill') {
      min = Math.min(
        selectionData!.baseIndex as number,
        selectionData!.lastIndex as number,
      );
      max = Math.max(
        selectionData!.baseIndex as number,
        selectionData!.lastIndex as number,
      );
    } else {
      min = Math.min(selectionData!.start, selectionData!.end);
      max = Math.max(selectionData!.start, selectionData!.end);
    }
    const variantIndexes = Array.from(
      { length: max - min + 1 },
      (_, i) => min + i,
    );
    return variantIndexes;
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
    if (selectionData?.mode === 'fill') {
      const min = Math.min(
        selectionData.grabberIndex as number,
        selectionData.lastIndex as number,
      );
      const max = Math.max(
        selectionData.grabberIndex as number,
        selectionData.lastIndex as number,
      );
      return index >= min && index <= max;
    } else {
      return false;
    }
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
    } else if (isFilled(fieldName)) {
      let styleClass = `${CLASS_PREFIX}-fill-cell `;
      if (
        index === selectionData?.baseIndex ||
        index === selectionData?.grabberIndex
      ) {
        styleClass = styleClass + `${CLASS_PREFIX}-base-cell`;
      } else if (
        index === selectionData?.lastIndex &&
        (selectionData?.baseIndex as number) <=
          (selectionData?.lastIndex as number)
      ) {
        styleClass = styleClass + `${CLASS_PREFIX}-fill-min `;
      } else if (
        index === selectionData?.lastIndex &&
        (selectionData?.baseIndex as number) >=
          (selectionData?.lastIndex as number)
      ) {
        styleClass = styleClass + `${CLASS_PREFIX}-fill-max`;
      }
      return styleClass;
    } else {
      return '';
    }
  };

  return {
    isSelected,
    isFilled,
    getVariantList,
    getActiveState,
  };
};

export default useBulkEditList;
