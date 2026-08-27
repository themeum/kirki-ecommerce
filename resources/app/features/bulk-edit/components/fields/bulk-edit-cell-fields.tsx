import { Controller, type FieldPath, useFormContext, useWatch } from 'react-hook-form';

import MediaPicker from '@/components/media-picker';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Tooltip from '@/components/ui/tooltip';
import { useCellSelection } from '@/features/bulk-edit/contexts/cell-selection-context';
import type { BulkEditFormValues, BulkEditProfileOption } from '@/features/bulk-edit/types';
import { BaseUnitDialog } from '@/features/products';
import type { BaseUnitFormPayload } from '@/features/products/schemas/forms/base-unit-form';
import { ShippingBoxField } from '@/features/settings';
import type { MediaRef } from '@/schemas/shared/media';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped, scopedMerge } from '@/theme/mixins';
import { calculateProfit } from '@/utils/common';
import { __ } from '@/wpi18n';

type FormPath = FieldPath<BulkEditFormValues>;

const rowPath = (rowIndex: number, field: string): FormPath =>
  `variants.${rowIndex}.${field}` as FormPath;

/**
 * A cell is always rendered live but sits under `pointer-events: none` until
 * it is the active cell — the mechanism that lets a first press select (and
 * potentially drag-select) while a second press activates the control.
 */
const controlWrapperStyle = (active: boolean) =>
  scoped({ pointerEvents: active ? 'auto' : 'none', width: '100%' });

/**
 * Select-like cells (dropdowns, the shipping-box picker) render borderless
 * with just a right-aligned chevron — the cell itself reads as the field.
 * `SelectTrigger` (and `ShippingBoxField`'s internal one) already renders
 * that chevron under `variant="invisible"`; this only trims the trigger's
 * own box model down to the cell's tight inset via its `data-slot` marker,
 * without touching the shared `select.tsx`/`shipping-box-field.tsx` files.
 */
const chevronCellStyle = (active: boolean) =>
  scopedMerge(
    { pointerEvents: active ? 'auto' : 'none', width: '100%' },
    {
      '& [data-slot="select-trigger"]': {
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        padding: `0 ${theme.spacing[1]}`,
      },
    },
  );

const PlaceholderCellContent = () => (
  <span css={scoped({ marginLeft: theme.spacing[1], color: theme.colors.text.secondary })}>_</span>
);

const usePropagatedChange = (field: string, rowIndex: number) => {
  const { setValue } = useFormContext<BulkEditFormValues>();
  const selection = useCellSelection();

  return (nextField: string, value: unknown) => {
    const targets = selection.getPropagationTargets(field, rowIndex);
    targets.forEach((targetRow) => {
      setValue(rowPath(targetRow, nextField), value as never, { shouldDirty: true });
    });
  };
};

const VariantIdentityControl = ({ rowIndex }: { rowIndex: number }) => {
  const { control, setValue } = useFormContext<BulkEditFormValues>();
  const name = useWatch({ control, name: rowPath(rowIndex, 'name') }) as string;
  const attributeValueLabels = useWatch({
    control,
    name: rowPath(rowIndex, 'attribute_value_labels'),
  }) as string[];
  const media = useWatch({ control, name: rowPath(rowIndex, 'media') }) as MediaRef | null;

  return (
    <Flex gap={3} align="center">
      <MediaPicker
        value={media}
        size="small"
        onChange={(nextMedia) =>
          setValue(rowPath(rowIndex, 'media'), nextMedia as never, { shouldDirty: true })
        }
      />
      <span css={scoped(styles.title)}>
        {name}
        {attributeValueLabels?.length ? ` - ${attributeValueLabels.join(' | ')}` : ''}
      </span>
    </Flex>
  );
};

const MoneyControl = ({
  field,
  rowIndex,
  active,
}: {
  field: string;
  rowIndex: number;
  active: boolean;
}) => {
  const { control } = useFormContext<BulkEditFormValues>();
  const handleChange = usePropagatedChange(field, rowIndex);

  return (
    <Controller
      control={control}
      name={rowPath(rowIndex, field)}
      render={({ field: rhfField, fieldState }) => {
        const input = (
          <Input
            ref={rhfField.ref}
            type="number"
            invisible
            placeholder="--"
            cssOverride={styles.compactInput}
            value={(rhfField.value as number | string | null) ?? ''}
            error={fieldState.invalid}
            onChange={(event) =>
              handleChange(field, event.target.value === '' ? null : Number(event.target.value))
            }
            onBlur={rhfField.onBlur}
          />
        );
        return (
          <div css={controlWrapperStyle(active)}>
            {fieldState.error ? (
              <Tooltip tip={fieldState.error.message} position="top">
                {input}
              </Tooltip>
            ) : (
              input
            )}
          </div>
        );
      }}
    />
  );
};

const TextControl = ({
  field,
  rowIndex,
  active,
}: {
  field: string;
  rowIndex: number;
  active: boolean;
}) => {
  const { control } = useFormContext<BulkEditFormValues>();
  const handleChange = usePropagatedChange(field, rowIndex);

  return (
    <Controller
      control={control}
      name={rowPath(rowIndex, field)}
      render={({ field: rhfField, fieldState }) => (
        <div css={controlWrapperStyle(active)}>
          <Input
            ref={rhfField.ref}
            invisible
            placeholder="--"
            cssOverride={styles.compactInput}
            value={(rhfField.value as string | null) ?? ''}
            error={fieldState.invalid}
            onChange={(event) => handleChange(field, event.target.value)}
            onBlur={rhfField.onBlur}
          />
        </div>
      )}
    />
  );
};

const NumberControl = ({
  field,
  rowIndex,
  active,
}: {
  field: string;
  rowIndex: number;
  active: boolean;
}) => {
  const { control } = useFormContext<BulkEditFormValues>();
  const handleChange = usePropagatedChange(field, rowIndex);

  return (
    <Controller
      control={control}
      name={rowPath(rowIndex, field)}
      render={({ field: rhfField, fieldState }) => (
        <div css={controlWrapperStyle(active)}>
          <Input
            ref={rhfField.ref}
            type="number"
            invisible
            placeholder="--"
            cssOverride={styles.compactInput}
            value={(rhfField.value as number | null) ?? ''}
            error={fieldState.invalid}
            onChange={(event) =>
              handleChange(field, event.target.value === '' ? null : Number(event.target.value))
            }
            onBlur={rhfField.onBlur}
          />
        </div>
      )}
    />
  );
};

/**
 * Unlike every other cell kind, a checkbox has no two-stage "select, then
 * activate" model — its wrapper stays `pointerEvents: 'auto'` regardless of
 * selection state, so a direct click on the glyph always toggles it (and,
 * via the ordinary mousedown-bubbles-to-the-<td> path, also selects the
 * cell — no separate selection call is needed here). A click anywhere else
 * in the cell never reaches the checkbox, so it only selects, per the
 * existing <td> onMouseDown handling.
 */
const CheckboxControl = ({ field, rowIndex }: { field: string; rowIndex: number }) => {
  const { control } = useFormContext<BulkEditFormValues>();
  const handleChange = usePropagatedChange(field, rowIndex);

  return (
    <Controller
      control={control}
      name={rowPath(rowIndex, field)}
      render={({ field: rhfField }) => (
        <div css={scoped(styles.checkboxWrapper)}>
          <Checkbox
            checked={Boolean(rhfField.value)}
            onCheckedChange={(checked) => handleChange(field, checked === true)}
          />
        </div>
      )}
    />
  );
};

const ReadonlyMoneyControl = ({ field, rowIndex }: { field: string; rowIndex: number }) => {
  const { control } = useFormContext<BulkEditFormValues>();
  const basePrice = useWatch({ control, name: rowPath(rowIndex, 'base_price') }) as
    number | string | null;
  const salePrice = useWatch({ control, name: rowPath(rowIndex, 'base_sale_price') }) as
    number | string | null;
  const costOfGoods = useWatch({ control, name: rowPath(rowIndex, 'base_cost_of_goods') }) as
    number | string | null;

  const value = calculateProfit(field, {
    base_price: basePrice ?? undefined,
    base_sale_price: salePrice ?? undefined,
    base_cost_of_goods: costOfGoods ?? undefined,
  });

  return (
    <Input
      value={value ?? ''}
      readOnly
      disabled
      invisible
      placeholder="--"
      cssOverride={styles.compactInput}
    />
  );
};

const ReadonlyNumberControl = ({ field, rowIndex }: { field: string; rowIndex: number }) => {
  const { control } = useFormContext<BulkEditFormValues>();
  const value = useWatch({ control, name: rowPath(rowIndex, field) }) as number | null;

  return <Input value={value ?? 0} readOnly disabled invisible cssOverride={styles.compactInput} />;
};

const UnitPriceControl = ({ rowIndex, active }: { rowIndex: number; active: boolean }) => {
  const { control, setValue } = useFormContext<BulkEditFormValues>();
  const selection = useCellSelection();
  const variant = useWatch({ control, name: `variants.${rowIndex}` });

  const handleChange = (payload: BaseUnitFormPayload) => {
    const targets = selection.getPropagationTargets('base_price_per_unit', rowIndex);
    targets.forEach((targetRow) => {
      setValue(rowPath(targetRow, 'total_unit_amount'), payload.total_unit_amount as never, {
        shouldDirty: true,
      });
      setValue(rowPath(targetRow, 'total_unit'), payload.total_unit as never, {
        shouldDirty: true,
      });
      setValue(rowPath(targetRow, 'base_unit_amount'), payload.base_unit_amount as never, {
        shouldDirty: true,
      });
      setValue(rowPath(targetRow, 'base_unit'), payload.base_unit as never, { shouldDirty: true });
    });
  };

  return (
    <div css={controlWrapperStyle(active)}>
      <BaseUnitDialog
        data={variant}
        currencySymbol={variant?.base_price_money_object?.currency?.symbol || '$'}
        buttonProps={{
          variant: 'ghost',
          cssOverride: {
            width: '100%',
            height: '100%',
            padding: `0 ${theme.spacing[1]}`,
            justifyContent: 'space-between',
            backgroundColor: 'transparent',
          },
        }}
        onChange={handleChange}
      />
    </div>
  );
};

const ShippingBoxControl = ({ rowIndex, active }: { rowIndex: number; active: boolean }) => (
  <div css={chevronCellStyle(active)}>
    <ShippingBoxField name={rowPath(rowIndex, 'shipping_box_id')} compact />
  </div>
);

const WEIGHT_UNIT_OPTIONS = [
  { value: 'kg', label: __('kg', 'kirki-ecommerce') },
  { value: 'g', label: __('g', 'kirki-ecommerce') },
  { value: 'lb', label: __('lb', 'kirki-ecommerce') },
  { value: 'oz', label: __('oz', 'kirki-ecommerce') },
];

const WeightControl = ({ rowIndex, active }: { rowIndex: number; active: boolean }) => {
  const { control } = useFormContext<BulkEditFormValues>();
  const handleWeightChange = usePropagatedChange('weight', rowIndex);
  const handleUnitChange = usePropagatedChange('weight_unit', rowIndex);

  return (
    <Controller
      control={control}
      name={rowPath(rowIndex, 'weight')}
      render={({ field: weightField }) => (
        <Controller
          control={control}
          name={rowPath(rowIndex, 'weight_unit')}
          render={({ field: unitField }) => (
            <div css={chevronCellStyle(active)}>
              <Flex gap={1} align="center">
                <Input
                  type="number"
                  invisible
                  placeholder="0"
                  cssOverride={styles.compactInput}
                  value={(weightField.value as number | null) ?? ''}
                  onChange={(event) =>
                    handleWeightChange(
                      'weight',
                      event.target.value === '' ? null : Number(event.target.value),
                    )
                  }
                />
                <Select
                  value={(unitField.value as string) ?? 'kg'}
                  onValueChange={(value) => handleUnitChange('weight_unit', value)}
                >
                  <SelectTrigger variant="invisible" cssOverride={styles.weightUnitTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEIGHT_UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Flex>
            </div>
          )}
        />
      )}
    />
  );
};

const ProfileSelectControl = ({
  field,
  rowIndex,
  active,
  options,
}: {
  field: string;
  rowIndex: number;
  active: boolean;
  options: BulkEditProfileOption[];
}) => {
  const { control } = useFormContext<BulkEditFormValues>();
  const handleChange = usePropagatedChange(field, rowIndex);

  return (
    <Controller
      control={control}
      name={rowPath(rowIndex, field)}
      render={({ field: rhfField }) => (
        <div css={chevronCellStyle(active)}>
          <Select
            value={
              typeof rhfField.value === 'string' || typeof rhfField.value === 'number'
                ? String(rhfField.value)
                : undefined
            }
            onValueChange={(value) => handleChange(field, value === '' ? null : Number(value))}
          >
            <SelectTrigger variant="invisible">
              <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  );
};

export {
  CheckboxControl,
  MoneyControl,
  NumberControl,
  PlaceholderCellContent,
  ProfileSelectControl,
  ReadonlyMoneyControl,
  ReadonlyNumberControl,
  ShippingBoxControl,
  TextControl,
  UnitPriceControl,
  VariantIdentityControl,
  WeightControl,
};

const styles = defineStyles({
  title: {
    textAlign: 'left',
    color: theme.colors.text.subdued,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  weightUnitTrigger: {
    width: 'auto',
    minWidth: '100px',
    paddingRight: theme.spacing[1],
    flexShrink: 0,
  },
  compactInput: {
    minHeight: 0,
    height: '100%',
    padding: 0,
    paddingInline: theme.spacing[1],
    textAlign: 'right',
  },
  checkboxWrapper: {
    pointerEvents: 'auto',
    width: '100%',
    ...flexCenter(),
  },
});
