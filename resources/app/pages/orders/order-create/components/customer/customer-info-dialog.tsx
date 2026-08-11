import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import CountryField from '@/components/form/country-field';
import StateField from '@/components/form/state-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import { PaymentIcon, ShippingAddressIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import type { OrderFormInput } from '@/types';
import { __ } from '@/wpi18n';

type CustomerInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  isSaving?: boolean;
};

const CustomerInfoDialog = ({ open, onOpenChange, onSave, isSaving }: CustomerInfoDialogProps) => {
  const form = useFormContext<OrderFormInput>();
  const snapshot = useRef(form.getValues());
  const isBillingSameAsShipping = useWatch({ control: form.control, name: 'is_billing_same_as_shipping' });
  const shippingCountry = useWatch({ control: form.control, name: 'shipping_country' });
  const billingCountry = useWatch({ control: form.control, name: 'billing_country' });

  const handleCancel = () => {
    form.reset(snapshot.current);
    onOpenChange(false);
  };

  const handleSave = () => {
    onSave?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent cssOverride={{ width: '720px' }}>
        <DialogHeader>
          <DialogTitle>
            {__('Customer information', 'kirki-ecommerce')}
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>
          <Flex direction="column" gap={4}>
            <Card cssOverride={cardStyles.formCard}>
              <CardHeader>
                <Flex gap={2} align="center">
                  <ShippingAddressIcon />
                  <Text weight="semibold">
                    {__('Shipping Address', 'kirki-ecommerce')}
                  </Text>
                </Flex>
              </CardHeader>
              <CardContent>
                <Flex direction="column" gap={4}>
                  <Grid>
                    <TextField<OrderFormInput>
                      name="shipping_first_name"
                      label={__('First name', 'kirki-ecommerce')}
                    />
                    <TextField<OrderFormInput>
                      name="shipping_last_name"
                      label={__('Last name', 'kirki-ecommerce')}
                    />
                  </Grid>
                  <Grid>
                    <TextField<OrderFormInput>
                      name="shipping_email"
                      label={__('Email', 'kirki-ecommerce')}
                    />
                    <TextField<OrderFormInput>
                      name="shipping_phone"
                      label={__('Phone', 'kirki-ecommerce')}
                    />
                  </Grid>
                  <CountryField<OrderFormInput> name="shipping_country" />
                  <TextField<OrderFormInput>
                    name="shipping_address_line1"
                    label={__('Address', 'kirki-ecommerce')}
                  />
                  <TextField<OrderFormInput>
                    name="shipping_address_line2"
                    label={__('Apartment, suite, etc. (optional)', 'kirki-ecommerce')}
                  />
                  <Grid>
                    <TextField<OrderFormInput>
                      name="shipping_city"
                      label={__('City', 'kirki-ecommerce')}
                    />
                    <StateField<OrderFormInput>
                      country={shippingCountry}
                      name="shipping_state"
                      label={__('State / Province', 'kirki-ecommerce')}
                    />
                  </Grid>
                  <TextField<OrderFormInput>
                    name="shipping_postal_code"
                    label={__('ZIP / Postal code', 'kirki-ecommerce')}
                  />
                </Flex>
              </CardContent>
            </Card>

            <Card cssOverride={cardStyles.formCard}>
              <CardHeader>
                <Flex gap={2} align="center">
                  <PaymentIcon />
                  <Text weight="semibold">
                    {__('Billing Address', 'kirki-ecommerce')}
                  </Text>
                </Flex>
              </CardHeader>
              <CardContent>
                <Flex direction="column" gap={4}>
                  <CheckboxField<OrderFormInput>
                    name="is_billing_same_as_shipping"
                    label={__('Same as shipping address', 'kirki-ecommerce')}
                  />
                  {!isBillingSameAsShipping && (
                    <>
                      <Grid>
                        <TextField<OrderFormInput>
                          name="billing_first_name"
                          label={__('First name', 'kirki-ecommerce')}
                        />
                        <TextField<OrderFormInput>
                          name="billing_last_name"
                          label={__('Last name', 'kirki-ecommerce')}
                        />
                      </Grid>
                      <Grid>
                        <TextField<OrderFormInput>
                          name="billing_email"
                          label={__('Email', 'kirki-ecommerce')}
                        />
                        <TextField<OrderFormInput>
                          name="billing_phone"
                          label={__('Phone', 'kirki-ecommerce')}
                        />
                      </Grid>
                      <CountryField<OrderFormInput> name="billing_country" />
                      <TextField<OrderFormInput>
                        name="billing_address_line1"
                        label={__('Address', 'kirki-ecommerce')}
                      />
                      <TextField<OrderFormInput>
                        name="billing_address_line2"
                        label={__('Apartment, suite, etc. (optional)', 'kirki-ecommerce')}
                      />
                      <Grid>
                        <TextField<OrderFormInput>
                          name="billing_city"
                          label={__('City', 'kirki-ecommerce')}
                        />
                        <StateField<OrderFormInput>
                          country={billingCountry}
                          name="billing_state"
                          label={__('State / Province', 'kirki-ecommerce')}
                        />
                      </Grid>
                      <TextField<OrderFormInput>
                        name="billing_postal_code"
                        label={__('ZIP / Postal code', 'kirki-ecommerce')}
                      />
                    </>
                  )}
                </Flex>
              </CardContent>
            </Card>
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

CustomerInfoDialog.displayName = 'CustomerInfoDialog';

export default CustomerInfoDialog;
