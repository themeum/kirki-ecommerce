import type { CSSObject } from '@emotion/react';
import { type ReactNode, useMemo, useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import MultiSelect, { type MultiSelectOption } from '@/components/ui/multi-select';
import Thumbnail from '@/components/ui/thumbnail';
import CustomerProfileCard from '@/features/customers/components/customer-profile-card';
import type { CustomerInfo } from '@/features/customers/schemas/catalog/customer';
import { useCustomersQuery } from '@/features/customers/services/customer';
import useDebounce from '@/hooks/use-debounce';
import { __ } from '@/wpi18n';

const OPTION_LIMIT = 20;

type CustomerOption = MultiSelectOption & {
  customer: CustomerInfo;
};

type CustomerSelectionFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const getCustomerName = (customer: CustomerInfo) => {
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();

  return fullName || customer.email;
};

const toOption = (customer: CustomerInfo): CustomerOption => ({
  value: customer.id,
  title: getCustomerName(customer),
  customer,
});

/**
 * Customer picker bound to react-hook-form. Offers the first page of
 * customers on focus and re-queries the server as the user types, so a
 * customer outside that page is still reachable by search.
 *
 * @param props Component props.
 *
 * @returns CustomerSelectionField element.
 * @since 1.0.0
 */
const CustomerSelectionField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder = __('Type to add customers..', 'kirki-ecommerce'),
  disabled,
  cssOverride,
}: CustomerSelectionFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data: customerData, isFetching } = useCustomersQuery({
    search: debouncedSearch,
    page: 1,
    limit: OPTION_LIMIT,
  });

  const options: CustomerOption[] = useMemo(
    () => (customerData?.results ?? []).map(toOption),
    [customerData],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedCustomers = (field.value ?? []) as CustomerInfo[];
        const selected = selectedCustomers.map(toOption);

        const handleChange = (next: CustomerOption[]) => {
          field.onChange(next.map((option) => option.customer));
        };

        return (
          <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
            {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
            <MultiSelect
              options={options}
              value={selected}
              onChange={handleChange}
              onSearchChange={setSearch}
              renderOption={(option) => (
                <CustomerProfileCard
                  name={option.title}
                  email={option.customer.email}
                  photo={option.customer.photo}
                />
              )}
              renderChip={(option) => (
                <Flex gap={1} align="center">
                  <Thumbnail
                    type="circle"
                    size="xsm"
                    src={option.customer.photo?.url}
                    alt={option.title}
                  />
                  {option.title}
                </Flex>
              )}
              placeholder={placeholder}
              emptyText={
                isFetching
                  ? __('Searching..', 'kirki-ecommerce')
                  : __('No customers found.', 'kirki-ecommerce')
              }
              disabled={disabled}
              error={Boolean(fieldState.error)}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

CustomerSelectionField.displayName = 'CustomerSelectionField';

export default CustomerSelectionField;
