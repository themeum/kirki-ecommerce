import { useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ShippingBoxDialog from '@/features/settings/shipping/pages/shipping-box/shipping-box-dialog';
import { useShippingBoxesQuery } from '@/features/settings/shipping/services/shipping';
import { PlusCircleIcon } from '@/icons';
import { theme } from '@/theme';
import type { SelectOption } from '@/types/components/common';
import { __ } from '@/wpi18n';

const ADD_SHIPPING_BOX_VALUE = '__add_shipping_box__';

type ShippingBoxFieldBaseProps = {
  compact?: boolean;
  onFieldChange?: (value: unknown, fieldName: string) => void;
};

type ShippingBoxFieldControlledProps = ShippingBoxFieldBaseProps & {
  name?: never;
  value?: number | string | null;
  onChange?: (value: unknown, fieldName: string) => void;
};

type ShippingBoxFieldRhfProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ShippingBoxFieldBaseProps & {
  name: TName;
  value?: never;
  onChange?: never;
};

type ShippingBoxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ShippingBoxFieldControlledProps | ShippingBoxFieldRhfProps<TFieldValues, TName>;

const useShippingBoxList = (): SelectOption[] => {
  const { data: shippingBoxes } = useShippingBoxesQuery({ limit: -1 });

  return (shippingBoxes ?? []).map((item) => ({
    value: item.id,
    title: `${item.name} - ${item.length} × ${item.width} × ${item.height} ${item.unit}`,
  }));
};

type ShippingBoxFieldViewProps = {
  fieldId: string;
  selectedValue: string;
  shippingBoxList: SelectOption[];
  compact: boolean;
  error?: boolean;
  invalid?: boolean;
  errorObject?: { message?: string };
  onValueChange: (next: string) => void;
  onSaveNewBox: (id?: number) => void;
};

const ShippingBoxFieldView = ({
  fieldId,
  selectedValue,
  shippingBoxList,
  compact,
  error,
  invalid,
  errorObject,
  onValueChange,
  onSaveNewBox,
}: ShippingBoxFieldViewProps) => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const selectControl = (
    <Select
      value={selectedValue}
      onValueChange={(next) => {
        if (next === ADD_SHIPPING_BOX_VALUE) {
          setOpenCreateDialog(true);
          return;
        }
        onValueChange(next);
      }}
    >
      <SelectTrigger
        id={fieldId}
        error={error}
        aria-invalid={invalid}
        variant={compact ? 'invisible' : 'default'}
      >
        <SelectValue placeholder={__('Select shipping box', 'kirki-ecommerce')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          value={ADD_SHIPPING_BOX_VALUE}
          cssOverride={{ marginLeft: `-${theme.spacing[1]}` }}
        >
          <Flex gap={2} align="center">
            <PlusCircleIcon />
            {__('Add shipping box', 'kirki-ecommerce')}
          </Flex>
        </SelectItem>
        {shippingBoxList.length > 0 && <SelectSeparator />}
        {shippingBoxList.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const dialog = openCreateDialog ? (
    <ShippingBoxDialog
      isOpen={openCreateDialog}
      onSave={(saveValue) => {
        onSaveNewBox(saveValue);
      }}
      onClose={() => {
        setOpenCreateDialog(false);
      }}
    />
  ) : null;

  if (compact) {
    return (
      <>
        {selectControl}
        {dialog}
      </>
    );
  }

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={fieldId}>{__('Shipping Box', 'kirki-ecommerce')}</FieldLabel>
      {selectControl}
      {invalid && errorObject && <FieldError errors={[errorObject]} />}
      {dialog}
    </Field>
  );
};

ShippingBoxFieldView.displayName = 'ShippingBoxFieldView';

const ShippingBoxFieldRhf = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  compact = false,
  onFieldChange,
}: ShippingBoxFieldRhfProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const shippingBoxList = useShippingBoxList();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedValue =
          field.value !== null && field.value !== undefined ? String(field.value) : '';

        const handleChange = (nextValue: unknown) => {
          field.onChange(nextValue === '' ? null : nextValue);
          onFieldChange?.(nextValue, String(name));
        };

        return (
          <ShippingBoxFieldView
            fieldId={String(name)}
            selectedValue={selectedValue}
            shippingBoxList={shippingBoxList}
            compact={compact}
            error={Boolean(fieldState.error)}
            invalid={fieldState.invalid}
            errorObject={fieldState.error}
            onValueChange={(next) => {
              handleChange(next);
            }}
            onSaveNewBox={(saveValue) => {
              handleChange(saveValue);
            }}
          />
        );
      }}
    />
  );
};

ShippingBoxFieldRhf.displayName = 'ShippingBoxFieldRhf';

const ShippingBoxFieldControlled = ({
  value,
  onChange,
  compact = false,
  onFieldChange,
}: ShippingBoxFieldControlledProps) => {
  const shippingBoxList = useShippingBoxList();
  const selectedValue = value !== null && value !== undefined ? String(value) : '';

  const handleChange = (nextValue: unknown) => {
    onChange?.(nextValue, 'shipping_box_id');
    onFieldChange?.(nextValue, 'shipping_box_id');
  };

  return (
    <ShippingBoxFieldView
      fieldId="shipping_box_id"
      selectedValue={selectedValue}
      shippingBoxList={shippingBoxList}
      compact={compact}
      onValueChange={(next) => {
        handleChange(next);
      }}
      onSaveNewBox={(saveValue) => {
        handleChange(saveValue);
      }}
    />
  );
};

ShippingBoxFieldControlled.displayName = 'ShippingBoxFieldControlled';

const ShippingBoxField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: ShippingBoxFieldProps<TFieldValues, TName>,
) => {
  if ('name' in props && props.name) {
    return (
      <ShippingBoxFieldRhf
        name={props.name}
        compact={props.compact}
        onFieldChange={props.onFieldChange}
      />
    );
  }

  return (
    <ShippingBoxFieldControlled
      value={props.value}
      onChange={props.onChange}
      compact={props.compact}
      onFieldChange={props.onFieldChange}
    />
  );
};

ShippingBoxField.displayName = 'ShippingBoxField';

export default ShippingBoxField;
