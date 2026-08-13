import type { ChangeEvent, Dispatch, KeyboardEvent, MouseEvent, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import { useBulkEditForm } from '@/features/bulk-edit';
import useBulkEditList from '@/features/bulk-edit/hooks/use-bulk-edit-list';
import { applyValue, resolveFillUpdate } from '@/features/bulk-edit/lib/fill-down';
import type { BulkEditSelectionData } from '@/features/bulk-edit/pages/bulk-edit-table/bulk-edit-table';
import type { ProductVariant } from '@/features/products';
import { useAttributesQuery } from '@/features/products';

type BulkEditVariant = ProductVariant & {
  has_limit_per_order?: boolean;
  max_per_order?: number;
};

type UseBulkEditRowOptions = {
  index: number;
  selectionData: BulkEditSelectionData | null;
  setSelectionData: Dispatch<SetStateAction<BulkEditSelectionData | null>>;
  isDragging: boolean;
  setIsDragging: Dispatch<SetStateAction<boolean>>;
};

export const useBulkEditRow = ({
  index,
  selectionData,
  setSelectionData,
  isDragging,
  setIsDragging,
}: UseBulkEditRowOptions) => {
  const { variants, updateVariants } = useBulkEditForm();
  const { data: attributes = [] } = useAttributesQuery({ limit: -1 });
  const currentVariation = variants[index] as BulkEditVariant;
  const [varTitle, setVarTitle] = useState<(string | undefined)[]>([]);

  const { isSelected, getVariantList, getActiveState } = useBulkEditList({
    selectionData,
    index,
  });

  useEffect(() => {
    const attributeValueMap = Object.fromEntries(
      (attributes || []).flatMap((attr) =>
        (attr.values ?? []).map((v) => [v.id, v.value]),
      ),
    );

    const variatioNames = currentVariation?.attribute_values.map(
      (valueId) => attributeValueMap[valueId],
    );
    setVarTitle(variatioNames);
  }, [attributes, currentVariation?.attribute_values]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (selectionData?.mode !== 'fill') {
        setIsDragging(false);
        return;
      }

      const variantIndexes = getVariantList('fill');
      const update = resolveFillUpdate(variants, selectionData, variantIndexes);
      updateVariants(update);

      setSelectionData((prev) => ({
        ...prev!,
        mode: 'select',
        end: Number(prev?.lastIndex ?? 0),
      }));
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- binds the window mouseup that ends a fill-drag; re-binding on every variant edit would drop the in-flight gesture
  }, [selectionData]);

  const handleInputEnterKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setSelectionData(null);
    }
  };

  const handleNumberInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    handleOnChange(parseFloat(event.target.value), fieldName);
  };

  const handleOnChange = (value: unknown, fieldName: string) => {
    if (selectionData!.start === selectionData!.end) {
      updateVariants({
        key: fieldName,
        value,
        variant_index: [index],
      });
      return;
    }

    applyValueToSelection(value, fieldName);
  };

  const applyValueToSelection = (value: unknown, fieldName: string) => {
    if (!selectionData) {
      return;
    }

    const variantIndexes = getVariantList('select');
    updateVariants(applyValue(variants, selectionData, variantIndexes, fieldName, value));
  };

  const onCellMouseDown = (
    _e: MouseEvent<HTMLTableCellElement>,
    fieldName: string,
  ) => {
    setIsDragging(true);
    if (!isSelected(fieldName)) {
      setSelectionData({
        fieldName,
        start: index,
        end: index,
        mode: 'select',
        baseIndex: index,
        lastIndex: index,
      });
    }
  };

  const onCellMouseEnter = (
    e: MouseEvent<HTMLTableCellElement>,
    _fieldName: string,
  ) => {
    if (!isDragging) {
      return;
    }
    e.preventDefault();
    if (selectionData?.mode === 'select') {
      setSelectionData((prev) => {
        if (!prev) {
          return prev;
        }
        return { ...prev, end: index };
      });
    } else {
      setSelectionData((prev) => {
        if (!prev) {
          return prev;
        }
        return { ...prev, lastIndex: index };
      });
    }
  };

  const onGrabberMouseDown = (
    _e: MouseEvent<HTMLSpanElement>,
    fieldName: string,
  ) => {
    setSelectionData((prev) => ({
      ...prev!,
      fieldName,
      mode: 'fill',
      grabberIndex: index,
      lastIndex: index,
    }));
  };

  const isMaxIndex = (rowIndex: number) => {
    if (selectionData?.baseIndex === undefined) {
      return false;
    }
    const max = Math.max(selectionData.baseIndex, selectionData.end);
    return rowIndex === max;
  };

  const handleMediaChange = (
    img: Record<string, unknown>,
    fieldName: string,
  ) => {
    delete img?.date;
    delete img?.modified;
    updateVariants({
      key: fieldName,
      value: img,
      variant_index: [index],
    });
  };

  return {
    currentVariation,
    varTitle,
    media: currentVariation?.media,
    getActiveState,
    isMaxIndex,
    handleInputEnterKeyDown,
    handleNumberInputChange,
    handleOnChange,
    onCellMouseDown,
    onCellMouseEnter,
    onGrabberMouseDown,
    handleMediaChange,
  };
};
