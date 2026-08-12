import type {
  ChangeEvent,
  Dispatch,
  KeyboardEvent,
  MouseEvent,
  SetStateAction,
} from 'react';
import { useEffect, useState } from 'react';

import ThumbnailSelector from '@/components/thumbnail-selector';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { useBulkEditForm } from '@/features/bulk-edit';
import useBulkEditList from '@/features/bulk-edit/hooks/use-bulk-edit-list';
import type { BulkEditSelectionData } from '@/features/bulk-edit/pages/bulk-edit-table/bulk-edit-table';
import type { UnitPriceValue } from '@/features/products';
import type { ProductVariant } from '@/features/products';
import { BaseUnitDialog } from '@/features/products';
import { useAttributesQuery } from '@/features/products';
import { ShippingBoxField } from '@/features/settings';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { calculateProfit } from '@/utils/common';
import { __ } from '@/wpi18n';

type BulkEditVariant = ProductVariant & {
  has_limit_per_order?: boolean;
  max_per_order?: number;
};

type SingleRowProps = {
  index: number;
  selectionData: BulkEditSelectionData | null;
  setSelectionData: Dispatch<SetStateAction<BulkEditSelectionData | null>>;
  isDragging: boolean;
  setIsDragging: Dispatch<SetStateAction<boolean>>;
  selectedFields: string[];
};

const SingleRow = (props: SingleRowProps) => {
  const {
    index,
    selectionData,
    setSelectionData,
    isDragging,
    setIsDragging,
    selectedFields,
  } = props;

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
      if (selectionData?.fieldName === 'base_price_per_unit') {
        handleUnitInfoChange(variantIndexes);
      } else {
        const sourceValue =
          variants[selectionData.baseIndex!][
          selectionData.fieldName as keyof ProductVariant
          ];

        updateVariants({
          key: selectionData.fieldName ?? '',
          value: sourceValue,
          variant_index: variantIndexes,
        });
      }
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

    applyValue(value, fieldName);
  };

  const applyValue = (value: unknown, fieldName: string) => {
    if (!selectionData) {
      return;
    }

    const variantIndexes = getVariantList('select');

    if (fieldName === 'base_price_per_unit') {
      handleUnitInfoChange(variantIndexes, value as UnitPriceValue);
    } else {
      updateVariants({
        key: fieldName || (selectionData.fieldName ?? ''),
        value,
        variant_index: variantIndexes,
      });
    }
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

  const handleUnitInfoChange = (
    variantIndexes: number[],
    newValue: UnitPriceValue = {},
  ) => {
    const unitValues = {
      total_unit: variants[selectionData!.baseIndex!]?.total_unit,
      base_unit: variants[selectionData!.baseIndex!]?.base_unit,
      total_unit_amount:
        variants[selectionData!.baseIndex!]?.total_unit_amount,
      base_unit_amount:
        variants[selectionData!.baseIndex!]?.base_unit_amount,
      ...newValue,
    };
    updateVariants({
      key: 'base_price_per_unit',
      value: unitValues,
      variant_index: variantIndexes,
    });
  };

  const isMaxIndex = (rowIndex: number) => {
    if (selectionData?.baseIndex === undefined) {
      return false;
    }
    const max = Math.max(selectionData.baseIndex, selectionData.end);
    if (rowIndex === max) {
      return true;
    }
    return false;
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

  const media = currentVariation?.media;

  return (
    <TableRow
      key={currentVariation.id}
      style={{ cursor: isDragging ? 'crosshair' : 'default' }}
    >
      <TableCell
        cssOverride={styles.stickyCell}
        data-sticky-cell="true"
      >
        <Flex gap={3} align="center">
          <ThumbnailSelector
            src={media?.url}
            onChange={(img) =>
              handleMediaChange(
                (Array.isArray(img) ? img[0] : img),
                'media',
              )
            }
            size="small"
          />
          <span css={scoped(styles.title)}>
            {`${currentVariation?.name} - `}
            {varTitle.join(' - ')}
          </span>
        </Flex>
      </TableCell>
      {selectedFields.includes('base_price') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'base_price')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'base_price')}
          {...getActiveState('base_price')}
        >
          <Input
            value={currentVariation?.base_price ?? undefined}
            placeholder="--"
            onChange={(event) => handleNumberInputChange(event, 'base_price')}
            onKeyDown={handleInputEnterKeyDown}
            invisible
            type="number"
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'base_price')}
          />
        </TableCell>
      )}
      {selectedFields.includes('base_sale_price') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'base_sale_price')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'base_sale_price')}
          {...getActiveState('base_sale_price')}
        >
          <Input
            value={currentVariation?.base_sale_price ?? undefined}
            onChange={(event) => handleNumberInputChange(event, 'base_sale_price')}
            onKeyDown={handleInputEnterKeyDown}
            invisible
            type="number"
            placeholder="--"
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'base_sale_price')}
          />
        </TableCell>
      )}
      {selectedFields.includes('base_cost_of_goods') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'base_cost_of_goods')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'base_cost_of_goods')}
          {...getActiveState('base_cost_of_goods')}
        >
          <Input
            value={currentVariation?.base_cost_of_goods ?? undefined}
            onChange={(event) =>
              handleNumberInputChange(event, 'base_cost_of_goods')
            }
            onKeyDown={handleInputEnterKeyDown}
            invisible
            type="number"
            placeholder="--"
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'base_cost_of_goods')}
          />
        </TableCell>
      )}
      {selectedFields.includes('profit') && (
        <TableCell disabled>
          <Input
            disabled
            readOnly
            value={calculateProfit('profit', currentVariation)}
            invisible
            placeholder="--"
          />
        </TableCell>
      )}
      {selectedFields.includes('margin') && (
        <TableCell disabled>
          <Input
            disabled
            readOnly
            value={calculateProfit('margin', currentVariation)}
            invisible
            placeholder="--"
          />
        </TableCell>
      )}
      {selectedFields.includes('show_unit_price') && (
        <TableCell
          alignment="center"
          onMouseDown={(e) => onCellMouseDown(e, 'show_unit_price')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'show_unit_price')}
          {...getActiveState('show_unit_price')}
        >
          <Checkbox
            value={!!currentVariation?.show_unit_price}
            onChange={(value) => handleOnChange(value, 'show_unit_price')}
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'show_unit_price')}
          />
        </TableCell>
      )}
      {selectedFields.includes('base_price_per_unit') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'base_price_per_unit')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'base_price_per_unit')}
          {...getActiveState('base_price_per_unit')}
        >
          {currentVariation?.show_unit_price ? (
            <BaseUnitDialog
              buttonProps={{ type: 'invisible' }}
              onChange={(value: UnitPriceValue) =>
                handleOnChange(value, 'base_price_per_unit')
              }
              data={currentVariation}
            />
          ) : (
            <span style={{ marginLeft: theme.spacing[3] }}>_</span>
          )}
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'base_price_per_unit')}
          />
        </TableCell>
      )}
      {selectedFields.includes('sku') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'sku')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'sku')}
          {...getActiveState('sku')}
        >
          <Input
            value={currentVariation?.sku ?? undefined}
            readOnly
            invisible
            placeholder="--"
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'sku')}
          />
        </TableCell>
      )}
      {selectedFields.includes('shipping_box_id') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'shipping_box_id')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'shipping_box_id')}
          {...getActiveState('shipping_box_id')}
          style={{ minWidth: '300px' }}
        >
          <ShippingBoxField
            compact
            value={currentVariation?.shipping_box_id}
            onChange={(value, fieldName) => {
              handleOnChange(value, fieldName);
            }}
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'shipping_box_id')}
          />
        </TableCell>
      )}
      {selectedFields.includes('weight') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'weight')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'weight')}
          {...getActiveState('weight')}
        >
          <Input
            value={currentVariation?.weight ?? undefined}
            onChange={(event) => handleNumberInputChange(event, 'weight')}
            invisible
            placeholder="--"
            type="number"
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'weight')}
          />
        </TableCell>
      )}
      {selectedFields.includes('weight_unit') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'weight_unit')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'weight_unit')}
          {...getActiveState('weight_unit')}
        >
          <Select
            value={currentVariation?.weight_unit ?? undefined}
            onValueChange={(value) => handleOnChange(value, 'weight_unit')}
          >
            <SelectTrigger variant="invisible">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">{__('KG', 'kirki-ecommerce')}</SelectItem>
              <SelectItem value="g">{__('G', 'kirki-ecommerce')}</SelectItem>
              <SelectItem value="lb">{__('LB', 'kirki-ecommerce')}</SelectItem>
              <SelectItem value="oz">{__('OZ', 'kirki-ecommerce')}</SelectItem>
            </SelectContent>
          </Select>
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'weight_unit')}
          />
        </TableCell>
      )}
      {selectedFields.includes('track_inventory') && (
        <TableCell
          alignment="center"
          onMouseDown={(e) => onCellMouseDown(e, 'track_inventory')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'track_inventory')}
          {...getActiveState('track_inventory')}
        >
          <Checkbox
            value={!!currentVariation?.track_inventory}
            onChange={(value) => handleOnChange(value, 'track_inventory')}
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'track_inventory')}
          />
        </TableCell>
      )}
      {selectedFields.includes('available_quantity') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'available_quantity')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'available_quantity')}
          {...getActiveState('available_quantity')}
        >
          {currentVariation?.track_inventory ? (
            <Input
              value={currentVariation?.available_quantity}
              onChange={(event) =>
                handleNumberInputChange(event, 'available_quantity')
              }
              onKeyDown={handleInputEnterKeyDown}
              invisible
              type="number"
            />
          ) : (
            <span style={{ marginLeft: theme.spacing[3] }}>_</span>
          )}
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'available_quantity')}
          />
        </TableCell>
      )}
      {selectedFields.includes('committed_quantity') && (
        <TableCell disabled>
          {currentVariation?.track_inventory ? (
            <Input
              disabled
              readOnly
              value={currentVariation?.committed_quantity || 0}
              invisible
            />
          ) : (
            <span style={{ marginLeft: theme.spacing[3] }}>_</span>
          )}
        </TableCell>
      )}
      {selectedFields.includes('has_limit_per_order') && (
        <TableCell
          alignment="center"
          onMouseDown={(e) => onCellMouseDown(e, 'has_limit_per_order')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'has_limit_per_order')}
          {...getActiveState('has_limit_per_order')}
        >
          <Checkbox
            value={!!currentVariation?.has_limit_per_order}
            onChange={(value) => handleOnChange(value, 'has_limit_per_order')}
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'has_limit_per_order')}
          />
        </TableCell>
      )}
      {selectedFields.includes('max_per_order') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'max_per_order')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'max_per_order')}
          {...getActiveState('max_per_order')}
        >
          {currentVariation?.has_limit_per_order ? (
            <Input
              value={currentVariation?.max_per_order || 0}
              onChange={(event) =>
                handleNumberInputChange(event, 'max_per_order')
              }
              onKeyDown={handleInputEnterKeyDown}
              invisible
              type="number"
            />
          ) : (
            <span style={{ marginLeft: theme.spacing[3] }}>_</span>
          )}

          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'max_per_order')}
          />
        </TableCell>
      )}
      {selectedFields.includes('is_visible') && (
        <TableCell
          alignment="center"
          onMouseDown={(e) => onCellMouseDown(e, 'is_visible')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'is_visible')}
          {...getActiveState('is_visible')}
        >
          <Checkbox
            value={!!currentVariation?.is_visible}
            onChange={(value) => handleOnChange(value, 'is_visible')}
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'is_visible')}
          />
        </TableCell>
      )}
      {selectedFields.includes('charge_taxes') && (
        <TableCell
          alignment="center"
          onMouseDown={(e) => onCellMouseDown(e, 'charge_taxes')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'charge_taxes')}
          {...getActiveState('charge_taxes')}
        >
          <Checkbox
            value={!!currentVariation?.charge_taxes}
            onChange={(value) => handleOnChange(value, 'charge_taxes')}
          />
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'charge_taxes')}
          />
        </TableCell>
      )}
      {selectedFields.includes('tax_profile_id') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'tax_profile_id')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'tax_profile_id')}
          {...getActiveState('tax_profile_id')}
        >
          {currentVariation?.charge_taxes ? (
            <Select
              value={
                currentVariation?.tax_profile_id !== undefined &&
                  currentVariation?.tax_profile_id !== null
                  ? String(currentVariation.tax_profile_id)
                  : undefined
              }
              onValueChange={(value) => handleOnChange(value, 'tax_profile_id')}
            >
              <SelectTrigger variant="invisible">
                <SelectValue />
              </SelectTrigger>
              <SelectContent />
            </Select>
          ) : (
            <span style={{ marginLeft: theme.spacing[3] }}>_</span>
          )}
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'tax_profile_id')}
          />
        </TableCell>
      )}
      {selectedFields.includes('shipping_profile_id') && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, 'shipping_profile_id')}
          onMouseEnter={(e) => onCellMouseEnter(e, 'shipping_profile_id')}
          {...getActiveState('shipping_profile_id')}
        >
          <Select
            value={
              currentVariation?.shipping_profile_id !== undefined &&
                currentVariation?.shipping_profile_id !== null
                ? String(currentVariation.shipping_profile_id)
                : undefined
            }
            onValueChange={(value) =>
              handleOnChange(value, 'shipping_profile_id')
            }
          >
            <SelectTrigger variant="invisible">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">
                {__('Heavy Weight', 'kirki-ecommerce')}
              </SelectItem>
              <SelectItem value="2">
                {__('Fragile', 'kirki-ecommerce')}
              </SelectItem>
              <SelectItem value="3">
                {__('Perishable', 'kirki-ecommerce')}
              </SelectItem>
              <SelectItem value="4">
                {__('Flammable', 'kirki-ecommerce')}
              </SelectItem>
            </SelectContent>
          </Select>
          <span
            role="presentation"
            data-grabber={isMaxIndex(index) ? 'true' : undefined}
            onMouseDown={(e) => onGrabberMouseDown(e, 'shipping_profile_id')}
          />
        </TableCell>
      )}
    </TableRow>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;

const styles = defineStyles({
  stickyCell: {
    minWidth: '260px',
    paddingRight: theme.spacing[3],
  },
  title: {
    textAlign: 'left',
    color: theme.colors.text.subdued,
  },
});
