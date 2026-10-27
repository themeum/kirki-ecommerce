import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import CountryField from '@/components/form/country-field';
import StateField from '@/components/form/state-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import {
  type OrderAddressFormInput,
  type OrderAddressFormPayload,
  OrderAddressFormSchema,
} from '@/features/orders/schemas/forms/order-address-form';
import { pickFormValues } from '@/libs/zod';
import { __ } from '@/wpi18n';

type NewAddressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  onSave: (payload: OrderAddressFormPayload) => void;
};

const FIELD_NAMES = {
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  addressLine1: 'address_line1',
  addressLine2: 'address_line2',
  city: 'city',
  state: 'state',
  postalCode: 'postal_code',
  country: 'country',
  phone: 'phone',
} as const;

const NewAddressDialog = ({
  open,
  onOpenChange,
  firstName,
  lastName,
  email,
  phone,
  onSave,
}: NewAddressDialogProps) => {
  const form = useForm<OrderAddressFormInput, unknown, OrderAddressFormPayload>({
    resolver: zodResolver(OrderAddressFormSchema),
    defaultValues: pickFormValues(OrderAddressFormSchema, {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
    }),
  });
  const country = useWatch({ control: form.control, name: FIELD_NAMES.country });

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const handleSave = (payload: OrderAddressFormPayload) => {
    onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent cssOverride={{ width: '560px' }}>
        <DialogHeader>
          <DialogTitle>{__('Add address', 'kirki-ecommerce')}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <CountryField name={FIELD_NAMES.country} />

              <Grid>
                <TextField
                  name={FIELD_NAMES.firstName}
                  label={__('First name', 'kirki-ecommerce')}
                />
                <TextField name={FIELD_NAMES.lastName} label={__('Last name', 'kirki-ecommerce')} />
              </Grid>

              <TextField name={FIELD_NAMES.addressLine1} label={__('Address', 'kirki-ecommerce')} />
              <TextField
                name={FIELD_NAMES.addressLine2}
                label={__('Apartment, suite, etc. (optional)', 'kirki-ecommerce')}
              />

              <Grid columns={3}>
                <TextField name={FIELD_NAMES.city} label={__('City', 'kirki-ecommerce')} />
                <StateField
                  country={country}
                  name={FIELD_NAMES.state}
                  label={__('State', 'kirki-ecommerce')}
                />
                <TextField
                  name={FIELD_NAMES.postalCode}
                  label={__('Zip code', 'kirki-ecommerce')}
                />
              </Grid>

              <TextField name={FIELD_NAMES.phone} label={__('Phone', 'kirki-ecommerce')} />
            </Flex>
          </Form>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button variant="primary" onClick={form.handleSubmit(handleSave)}>
            {__('Save', 'kirki-ecommerce')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

NewAddressDialog.displayName = 'NewAddressDialog';

export default NewAddressDialog;
