import { useMemo, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

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
import Grid from '@/components/ui/grid';
import type { Customer } from '@/features/customers';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import { __ } from '@/wpi18n';

type AddressType = 'shipping' | 'billing';

type AddressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: AddressType;
  customer: Customer;
  onSave?: () => void;
  isSaving?: boolean;
};

const ADDRESS_TITLES: Record<AddressType, string> = {
  shipping: __('Edit shipping address', 'kirki-ecommerce'),
  billing: __('Edit billing address', 'kirki-ecommerce'),
};

const FIELD_NAMES = {
  shipping: {
    firstName: 'shipping_first_name',
    lastName: 'shipping_last_name',
    email: 'shipping_email',
    addressLine1: 'shipping_address_line1',
    addressLine2: 'shipping_address_line2',
    city: 'shipping_city',
    state: 'shipping_state',
    postalCode: 'shipping_postal_code',
    country: 'shipping_country',
    phone: 'shipping_phone',
  },
  billing: {
    firstName: 'billing_first_name',
    lastName: 'billing_last_name',
    email: 'billing_email',
    addressLine1: 'billing_address_line1',
    addressLine2: 'billing_address_line2',
    city: 'billing_city',
    state: 'billing_state',
    postalCode: 'billing_postal_code',
    country: 'billing_country',
    phone: 'billing_phone',
  },
} as const satisfies Record<AddressType, Record<string, keyof OrderFormInput>>;

const ADDRESS_FIELD_KEYS = [
  'shipping_first_name',
  'shipping_last_name',
  'shipping_email',
  'shipping_phone',
  'shipping_address_line1',
  'shipping_address_line2',
  'shipping_city',
  'shipping_state',
  'shipping_postal_code',
  'shipping_country',
  'billing_first_name',
  'billing_last_name',
  'billing_email',
  'billing_phone',
  'billing_address_line1',
  'billing_address_line2',
  'billing_city',
  'billing_state',
  'billing_postal_code',
  'billing_country',
] as const satisfies readonly (keyof OrderFormInput)[];

const AddressDialog = ({
  open,
  onOpenChange,
  type,
  customer,
  onSave,
  isSaving,
}: AddressDialogProps) => {
  const form = useFormContext<OrderFormInput>();
  const snapshot = useRef(form.getValues());

  const fields = FIELD_NAMES[type];
  const country = useWatch({ control: form.control, name: fields.country });

  const addressOptions = useMemo(
    () =>
      (customer.addresses ?? []).map((address) => {
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
      }),
    [customer.addresses, customer.first_name, customer.last_name],
  );

  const handleSelectAddress = (nextValue: string | string[]) => {
    const value = Array.isArray(nextValue) ? (nextValue[0] ?? '') : nextValue;

    const address = (customer.addresses ?? []).find((item) => String(item.id) === value);
    if (!address) {
      return;
    }

    form.setValues(
      {
        [fields.firstName]: address.first_name ?? '',
        [fields.lastName]: address.last_name ?? '',
        [fields.addressLine1]: address.address_line1 ?? '',
        [fields.addressLine2]: address.address_line2 ?? '',
        [fields.city]: address.city ?? '',
        [fields.state]: address.state ?? '',
        [fields.postalCode]: address.postal_code ?? '',
        [fields.country]: address.country ?? '',
        [fields.phone]: address.phone ?? '',
      },
      { shouldDirty: true },
    );
  };

  const handleCancel = () => {
    form.reset(snapshot.current);
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleCancel();
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (type === 'billing') {
      const shippingDefault =
        (customer.addresses ?? []).find((address) => address.is_default_shipping) ?? null;
      const billingDefault =
        (customer.addresses ?? []).find((address) => address.is_default_billing) ?? null;
      const isSameDefaultAddress = Boolean(
        shippingDefault && billingDefault && shippingDefault.id === billingDefault.id,
      );

      const dirtyFields = form.formState.dirtyFields;
      const areAddressFieldsDirty = ADDRESS_FIELD_KEYS.some((key) => Boolean(dirtyFields[key]));

      form.setValue('is_billing_same_as_shipping', isSameDefaultAddress && !areAddressFieldsDirty, {
        shouldDirty: true,
      });
    }

    const isValid = await form.trigger(Object.values(fields));

    if (!isValid) {
      return;
    }

    onSave?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent cssOverride={{ width: '560px' }}>
        <DialogHeader>
          <DialogTitle>{ADDRESS_TITLES[type]}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>
          <Flex direction="column" gap={4}>
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

            <CountryField name={fields.country} />

            <Grid>
              <TextField name={fields.firstName} label={__('First name', 'kirki-ecommerce')} />
              <TextField name={fields.lastName} label={__('Last name', 'kirki-ecommerce')} />
            </Grid>

            <TextField name={fields.addressLine1} label={__('Address', 'kirki-ecommerce')} />
            <TextField
              name={fields.addressLine2}
              label={__('Apartment, suite, etc. (optional)', 'kirki-ecommerce')}
            />

            <Grid columns={3}>
              <TextField name={fields.city} label={__('City', 'kirki-ecommerce')} />
              <StateField
                country={country}
                name={fields.state}
                label={__('State', 'kirki-ecommerce')}
              />
              <TextField name={fields.postalCode} label={__('Zip code', 'kirki-ecommerce')} />
            </Grid>

            <TextField name={fields.phone} label={__('Phone', 'kirki-ecommerce')} />
          </Flex>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            {__('Save', 'kirki-ecommerce')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

AddressDialog.displayName = 'AddressDialog';

export default AddressDialog;
