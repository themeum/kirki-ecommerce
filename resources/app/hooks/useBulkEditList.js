import React from "react";
import { CLASS_PREFIX } from "@/conf";

const useBulkEditList = ({ selectionData, index }) => {
  const getVariantList = (type) => {
    let min = null;
    let max = null;

    if (type === "fill") {
      min = Math.min(selectionData.baseIndex, selectionData.lastIndex);
      max = Math.max(selectionData.baseIndex, selectionData.lastIndex);
    } else {
      min = Math.min(selectionData.start, selectionData.end);
      max = Math.max(selectionData.start, selectionData.end);
    }
    const variantIndexes = Array.from(
      { length: max - min + 1 },
      (_, i) => min + i
    );
    return variantIndexes;
  };
  const isSelected = (fieldName) => {
    if (!selectionData || selectionData.fieldName !== fieldName) return false;

    const min = Math.min(selectionData.start, selectionData.end);
    const max = Math.max(selectionData.start, selectionData.end);
    return index >= min && index <= max;
  };

  const isFilled = (fieldName) => {
    if (!selectionData || selectionData.fieldName !== fieldName) return false;
    if (selectionData?.mode === "fill") {
      const min = Math.min(selectionData.grabberIndex, selectionData.lastIndex);
      const max = Math.max(selectionData.grabberIndex, selectionData.lastIndex);
      return index >= min && index <= max;
    } else return false;
  };
  const getActiveState = (fieldName) => {
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
        selectionData?.baseIndex <= selectionData?.lastIndex
      ) {
        styleClass = styleClass + `${CLASS_PREFIX}-fill-min `;
      } else if (
        index === selectionData?.lastIndex &&
        selectionData?.baseIndex >= selectionData?.lastIndex
      ) {
        styleClass = styleClass + `${CLASS_PREFIX}-fill-max`;
      }
      return styleClass;
    } else return "";
  };

  return {
    isSelected,
    isFilled,
    getVariantList,
    getActiveState,
  };
};

export default useBulkEditList;
