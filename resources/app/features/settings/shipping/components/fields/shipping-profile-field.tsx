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
import { CreateProfilePopup } from '@/features/settings/shipping/pages/shipping-profile/create-profile-dialog';
import { useShippingProfilesQuery } from '@/features/settings/shipping/services/shipping';
import { PlusCircleIcon } from '@/icons';
import type { SelectOption } from '@/types/components/common';
import { __ } from '@/wpi18n';

const ADD_SHIPPING_PROFILE_VALUE = '__add_shipping_profile__';

type ShippingProfileFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const useShippingProfileList = (): SelectOption[] => {
  const { data: shippingProfiles } = useShippingProfilesQuery({ limit: -1 });

  return (shippingProfiles ?? []).map((item) => ({
    value: item.id,
    title: item.name,
  }));
};

const ShippingProfileField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
}: ShippingProfileFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const shippingProfileList = useShippingProfileList();
  const [openAddProfilePopup, setOpenAddProfilePopup] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedValue =
          field.value !== null && field.value !== undefined ? String(field.value) : '';

        return (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={String(name)}>
              {__('Shipping profile', 'kirki-ecommerce')}
            </FieldLabel>
            <Select
              value={selectedValue}
              onValueChange={(next) => {
                if (next === ADD_SHIPPING_PROFILE_VALUE) {
                  setOpenAddProfilePopup(true);
                  return;
                }
                field.onChange(next === '' ? null : next);
              }}
            >
              <SelectTrigger
                id={String(name)}
                error={Boolean(fieldState.error)}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder={__('Select shipping profile', 'kirki-ecommerce')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ADD_SHIPPING_PROFILE_VALUE}>
                  <Flex gap={2} align="center">
                    <PlusCircleIcon />
                    {__('Add Shipping Profile', 'kirki-ecommerce')}
                  </Flex>
                </SelectItem>
                {shippingProfileList.length > 0 && <SelectSeparator />}
                {shippingProfileList.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            <CreateProfilePopup
              isOpen={openAddProfilePopup}
              onClose={() => {
                setOpenAddProfilePopup(false);
              }}
              onSave={(id) => {
                field.onChange(id);
              }}
            />
          </Field>
        );
      }}
    />
  );
};

ShippingProfileField.displayName = 'ShippingProfileField';

export default ShippingProfileField;
