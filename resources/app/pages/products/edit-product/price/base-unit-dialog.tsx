import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Input from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDownIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/molecules/flex';
import {
  BaseUnitFormSchema,
  mapBaseUnitFromVariant,
  toUnitPriceValue,
  type BaseUnitFormValues,
} from '@/schemas/forms/base-unit-form';
import type { FormErrors, ProductVariant, UnitPriceValue } from '@/types';
import { __ } from '@/wpi18n';

import {
  getSpecifiedUnitList,
  normalizedUnit,
  unitList,
} from '@/pages/products/edit-product/price/utils';

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

  const baseUnitOptions = getSpecifiedUnitList(form.getValues('total_unit'));

  return (
    <Popover
      open={openUnitPopup}
      onOpenChange={(next) => {
        if (!next) {
          setOpenUnitPopup(false);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          style={{ width: '240px', justifyContent: 'space-between' }}
          {...buttonProps}
        >
          {btnText}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" style={{ width: '280px' }}>
        <Form {...form}>
          <Flex direction="column" gap={16}>
            <Flex direction="column" gap={12}>
              <Flex direction="column" gap={8}>
                <FormLabel>
                  {__('Total unit in product', 'kirki-ecommerce')}
                </FormLabel>
                <Flex gap={8}>
                  <div style={{ flex: 1 }}>
                    <FormField
                      control={form.control}
                      name="total_unit_amount"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              value={field.value ?? ''}
                              onChange={(event) => {
                                field.onChange(event.target.value);
                                form.clearErrors([
                                  'total_unit_amount',
                                  'total_unit',
                                ]);
                              }}
                              error={Boolean(fieldState.error)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div style={{ width: '50%' }}>
                    <FormField
                      control={form.control}
                      name="total_unit"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <Select
                            value={field.value ?? ''}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.clearErrors(['total_unit_amount', 'total_unit']);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger error={Boolean(fieldState.error)}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {unitList.map((item, index) =>
                                item.heading ? (
                                  <SelectLabel key={`heading-${index}`}>
                                    {item.heading}
                                  </SelectLabel>
                                ) : (
                                  <SelectItem
                                    key={item.value}
                                    value={item.value as string}
                                  >
                                    {item.title}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Flex>
              </Flex>
              <Flex direction="column" gap={8}>
                <FormLabel>{__('Base unit', 'kirki-ecommerce')}</FormLabel>
                <Flex gap={8}>
                  <div style={{ flex: 1 }}>
                    <FormField
                      control={form.control}
                      name="base_unit_amount"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              value={field.value ?? ''}
                              onChange={(event) => {
                                field.onChange(event.target.value);
                                form.clearErrors([
                                  'base_unit_amount',
                                  'base_unit',
                                ]);
                              }}
                              error={Boolean(fieldState.error)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div style={{ width: '50%' }}>
                    <FormField
                      control={form.control}
                      name="base_unit"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <Select
                            value={field.value ?? ''}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.clearErrors(['base_unit_amount', 'base_unit']);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger error={Boolean(fieldState.error)}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {baseUnitOptions.map((item) => (
                                <SelectItem
                                  key={item.value}
                                  value={item.value as string}
                                >
                                  {item.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Flex>
              </Flex>
            </Flex>
            <Flex gap={8}>
              <Button
                variant="ghost"
                style={{ flex: 1 }}
                onClick={handleOnClose}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                style={{ flex: 1 }}
                disabled={!basePricePerBaseUnitAmount()}
                onClick={handleSaveUnitData}
              >
                {__('Okay', 'kirki-ecommerce')}
              </Button>
            </Flex>
          </Flex>
        </Form>
      </PopoverContent>
    </Popover>
  );
};

BaseUnitPopup.displayName = 'BaseUnitPopup';

export default BaseUnitPopup;
