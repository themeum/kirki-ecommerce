import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form, FormField, FormItem } from '@/components/ui/form';
import { ChevronDownIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Button from '@/molecules/button';
import { DropdownMenuContent } from '@/molecules/dropdown';
import Flex from '@/molecules/flex';
import SelectInput from '@/molecules/select-input';
import {
  BaseUnitFormSchema,
  mapBaseUnitFromVariant,
  toUnitPriceValue,
  type BaseUnitFormValues,
} from '@/schemas/forms/base-unit-form';
import type {
  FormErrors,
  ProductVariant,
  SelectOption,
  UnitPriceValue,
} from '@/types';
import { __ } from '@/wpi18n';

import {
  getSpecifiedUnitList,
  normalizedUnit,
  unitList,
} from '@/pages/products/edit-product/price/utils';

type SelectInputValue = {
  value?: string | number;
  unit?: string | number;
};

type BaseUnitPopupProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  data?: ProductVariant;
  onChange: (value: UnitPriceValue & { price?: number | string | null }) => void;
  buttonProps?: Record<string, unknown>;
};

const BaseUnitPopup = ({
  errors,
  onChange,
  buttonProps,
  data,
}: BaseUnitPopupProps) => {
  const totalUnitAnchorRef = useRef<HTMLDivElement>(null);
  const baseUnitAnchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLSpanElement | HTMLAnchorElement>(null);
  const [openUnitPopup, setOpenUnitPopup] = useState(false);

  const form = useForm<BaseUnitFormValues>({
    resolver: zodResolver(BaseUnitFormSchema),
    defaultValues: mapBaseUnitFromVariant(data),
  });

  const unitData = form.watch();

  useEffect(() => {
    form.reset(mapBaseUnitFromVariant(data));
  }, [data, form]);

  useEffect(() => {
    const hasErrors = Object.values(errors).some(Boolean);
    if (!hasErrors) {
      return;
    }
    applyServerErrors(form, { errors } as ErrorResponse, {
      stripPrefix: 'variants.0.',
    });
  }, [errors, form]);

  const basePricePerBaseUnitAmount = () => {
    const {
      total_unit_amount,
      total_unit,
      base_unit_amount,
      base_unit,
      price,
    } = unitData;

    const totalAmountInGrams =
      (total_unit_amount as number) * normalizedUnit[total_unit as string];

    const baseAmountInGrams =
      (base_unit_amount as number) * normalizedUnit[base_unit as string];

    const numberOfBaseUnits = totalAmountInGrams / baseAmountInGrams;

    const basePricePerUnit = (price as number) / numberOfBaseUnits;
    return basePricePerUnit;
  };

  const handleSaveUnitData = () => {
    onChange(toUnitPriceValue(form.getValues()));
    setOpenUnitPopup(false);
  };

  const handleOnClose = () => {
    form.reset(mapBaseUnitFromVariant(data));
    setOpenUnitPopup(false);
  };

  const btnText = basePricePerBaseUnitAmount()
    ? `${basePricePerBaseUnitAmount().toFixed(2)} / ${
        unitData.base_unit_amount
      }${unitData.base_unit}`
    : __('Add', 'kirki-ecommerce');

  return (
    <>
      <Button
        type="outlined"
        text={btnText}
        style={{ width: '240px' }}
        rightIcon={<ChevronDownIcon />}
        onClick={() => setOpenUnitPopup((prev) => !prev)}
        ref={popoverRef}
        size="fullWidth"
        contentStyle={{ justifyContent: 'space-between' }}
        {...buttonProps}
      />
      <DropdownMenuContent
        isOpen={openUnitPopup}
        triggerRef={popoverRef}
        onClose={() => setOpenUnitPopup(false)}
      >
        <Form {...form}>
          <Flex direction="column" gap={16} style={{ padding: '16px' }}>
            <Flex direction="column" gap={12}>
              <FormField
                control={form.control}
                name="total_unit_amount"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div ref={totalUnitAnchorRef}>
                      <SelectInput
                        label={__('Total unit in product', 'kirki-ecommerce')}
                        min={0}
                        value={{
                          value: field.value || '',
                          unit: form.getValues('total_unit') ?? undefined,
                        }}
                        optionsArray={unitList as SelectOption[]}
                        onChange={(value: SelectInputValue) => {
                          field.onChange(value.value);
                          form.setValue(
                            'total_unit',
                            (value.unit as string) ?? null,
                          );
                          form.clearErrors(['total_unit_amount', 'total_unit']);
                        }}
                        error={
                          (fieldState.error?.message ||
                            form.formState.errors.total_unit?.message) as
                            | string
                            | boolean
                            | undefined
                        }
                        anchorRef={totalUnitAnchorRef}
                        selectWidth="50%"
                      />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="base_unit_amount"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div ref={baseUnitAnchorRef}>
                      <SelectInput
                        label={__('Base unit', 'kirki-ecommerce')}
                        min={0}
                        value={{
                          value: field.value || '',
                          unit: form.getValues('base_unit') ?? undefined,
                        }}
                        optionsArray={
                          getSpecifiedUnitList(
                            form.getValues('total_unit'),
                          ) as SelectOption[]
                        }
                        onChange={(value: SelectInputValue) => {
                          field.onChange(value.value);
                          form.setValue(
                            'base_unit',
                            (value.unit as string) ?? null,
                          );
                          form.clearErrors(['base_unit_amount', 'base_unit']);
                        }}
                        error={
                          (fieldState.error?.message ||
                            form.formState.errors.base_unit?.message) as
                            | string
                            | boolean
                            | undefined
                        }
                        anchorRef={baseUnitAnchorRef}
                        selectWidth="50%"
                      />
                    </div>
                  </FormItem>
                )}
              />
            </Flex>
            <Flex>
              <Button
                type="ghost"
                text={__('Cancel', 'kirki-ecommerce')}
                size="fullWidth"
                onClick={handleOnClose}
              />
              <Button
                type="primary"
                text={__('Okay', 'kirki-ecommerce')}
                size="fullWidth"
                state={basePricePerBaseUnitAmount() ? '' : 'disabled'}
                onClick={handleSaveUnitData}
              />
            </Flex>
          </Flex>
        </Form>
      </DropdownMenuContent>
    </>
  );
};

BaseUnitPopup.displayName = 'BaseUnitPopup';

export default BaseUnitPopup;
