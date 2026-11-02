import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';

import CountryField from '@/components/form/country-field';
import StateField from '@/components/form/state-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import Combobox from '@/components/ui/combobox';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import type { Customer } from '@/features/customers';
import {
  type OrderAddressFormInput,
  type OrderAddressFormPayload,
  OrderAddressFormSchema,
} from '@/features/orders/schemas/forms/order-address-form';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import { pickFormValues } from '@/libs/zod';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type AddressType = 'shipping' | 'billing';

type AddressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: AddressType;
  customer?: Customer;
  onSave?: () => void;
  isSaving?: boolean;
};

const ADDRESS_TITLES: Record<AddressType, string> = {
  shipping: __('Edit shipping address', 'kirki-ecommerce'),
  billing: __('Edit billing address', 'kirki-ecommerce'),
};

const ADDRESS_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'company',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'postal_code',
  'country',
] as const satisfies readonly (keyof OrderAddressFormInput)[];

type AddressField = (typeof ADDRESS_FIELDS)[number];

const toOrderField = (type: AddressType, field: AddressField) =>
  `${type}_${field}` as const satisfies keyof OrderFormInput;

const AddressDialog = ({
  open,
  onOpenChange,
  type,
  customer,
  onSave,
  isSaving,
}: AddressDialogProps) => {
  const orderForm = useFormContext<OrderFormInput>();

  const isBillingSameAsShipping = orderForm.getValues('is_billing_same_as_shipping');
  const sourceType: AddressType = type === 'billing' && isBillingSameAsShipping ? 'shipping' : type;

  const form = useForm<OrderAddressFormInput, unknown, OrderAddressFormPayload>({
    resolver: zodResolver(OrderAddressFormSchema),
    defaultValues: pickFormValues(
      OrderAddressFormSchema,
      Object.fromEntries(
        ADDRESS_FIELDS.map((field) => [
          field,
          orderForm.getValues(toOrderField(sourceType, field)),
        ]),
      ),
    ),
  });
  const { isDirty } = form.formState;
  const country = useWatch({ control: form.control, name: 'country' });

  const addressOptions = useMemo(() => {
    if (!isDefined(customer)) {
      return [];
    }
    return (customer.addresses ?? []).map((address) => {
      const name = [
        address.first_name || customer.first_name,
        address.last_name || customer.last_name,
      ]
        .filter(Boolean)
        .join(' ');

      const addressLine = [address.address_line1, address.address_line2, address.city]
        .filter(Boolean)
        .join(', ');

      return {
        value: String(address.id),
        label: name,
        description: addressLine || undefined,
      };
    });
  }, [customer]);

  const handleSelectAddress = (nextValue: string | string[]) => {
    const value = Array.isArray(nextValue) ? (nextValue[0] ?? '') : nextValue;

    const address = (customer?.addresses ?? []).find((item) => String(item.id) === value);
    if (!address) {
      return;
    }

    form.setValues(
      {
        first_name: address.first_name ?? '',
        last_name: address.last_name ?? '',
        address_line1: address.address_line1 ?? '',
        address_line2: address.address_line2 ?? '',
        city: address.city ?? '',
        state: address.state ?? '',
        postal_code: address.postal_code ?? '',
        country: address.country ?? '',
        phone: address.phone ?? '',
      },
      { shouldDirty: true },
    );
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSave = (payload: OrderAddressFormPayload) => {
    const addressEntries = ADDRESS_FIELDS.map(
      (field) => [toOrderField(type, field), payload[field]] as const,
    );
    const detachesBilling = type === 'billing' && isDirty;

    orderForm.setValues({
      ...Object.fromEntries(addressEntries),
      ...(detachesBilling && { is_billing_same_as_shipping: false }),
    }, {
      shouldDirty: true,
    });
    orderForm.clearErrors(addressEntries.map(([name]) => name));

    onSave?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent cssOverride={{ width: '560px' }}>
        <DialogHeader>
          <DialogTitle>{ADDRESS_TITLES[type]}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>
          <Form {...form}>
            <Flex direction="column" gap={4}>
              {addressOptions.length > 1 && (
                <Field cssOverride={{ width: 'max-content' }}>
                  <FieldLabel>{__('Address', 'kirki-ecommerce')}</FieldLabel>
                  <Combobox
                    options={addressOptions}
                    value=""
                    onChange={handleSelectAddress}
                    placeholder={__('Select address', 'kirki-ecommerce')}
                    searchPlaceholder={__('Search addresses', 'kirki-ecommerce')}
                  />
                </Field>
              )}

              <CountryField name="country" />

              <Grid>
                <TextField name="first_name" label={__('First name', 'kirki-ecommerce')} />
                <TextField name="last_name" label={__('Last name', 'kirki-ecommerce')} />
              </Grid>

              <TextField name="address_line1" label={__('Address', 'kirki-ecommerce')} />
              <TextField
                name="address_line2"
                label={__('Apartment, suite, etc. (optional)', 'kirki-ecommerce')}
              />

              <Grid columns={3}>
                <TextField name="city" label={__('City', 'kirki-ecommerce')} />
                <StateField country={country} name="state" label={__('State', 'kirki-ecommerce')} />
                <TextField name="postal_code" label={__('Zip code', 'kirki-ecommerce')} />
              </Grid>

              <TextField name="phone" label={__('Phone', 'kirki-ecommerce')} />
            </Flex>
          </Form>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button variant="primary" onClick={form.handleSubmit(handleSave)} loading={isSaving} disabled={!isDirty}>
            {__('Save', 'kirki-ecommerce')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

AddressDialog.displayName = 'AddressDialog';

export default AddressDialog;
