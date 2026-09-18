import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import CountryField from '@/components/form/country-field';
import StateField from '@/components/form/state-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import type { CustomerFormInput } from '@/features/customers/schemas/forms/customer-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';
import { BadgeDollarSign } from 'lucide-react';

const BillingAddress = () => {
  const { setValue, control } = useFormContext<CustomerFormInput>();
  const isSameAsShipping = Boolean(useWatch({ control, name: 'is_billing_same_as_shipping' }));
  const country = useWatch({
    control,
    name: 'billing_address.country',
  });

  return (
    <Card>
      <CardHeader>
        <Flex gap={2} align="center">
          <BadgeDollarSign size={16} color={theme.colors.icon.primary} />
          <Text weight="semibold">{__('Billing Address', 'kirki-ecommerce')}</Text>
        </Flex>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={4}>
          <Card cssOverride={cardStyles.innerDarkCard} noShadow>
            <CardContent cssOverride={cardStyles.innerDarkContent}>
              <CheckboxField
                name="is_billing_same_as_shipping"
                label={__('Same as shipping address', 'kirki-ecommerce')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setValue('billing_address', {});
                  }
                }}
              />
            </CardContent>
          </Card>
          <Flex direction="column" gap={4}>
            <CountryField
              name="billing_address.country"
              label={__('Country / Region', 'kirki-ecommerce')}
              disabled={isSameAsShipping}
            />
            <TextField
              name="billing_address.address_line1"
              label={__('Address', 'kirki-ecommerce')}
              placeholder={__('e.g. 124 main st', 'kirki-ecommerce')}
              disabled={isSameAsShipping}
            />
            <TextField
              name="billing_address.address_line2"
              label={__('Apartment, suite, etc. (optional)', 'kirki-ecommerce')}
              disabled={isSameAsShipping}
            />
            <Grid>
              <TextField
                name="billing_address.city"
                label={__('City', 'kirki-ecommerce')}
                disabled={isSameAsShipping}
              />
              <StateField
                country={country}
                name="billing_address.state"
                label={__('State / Province', 'kirki-ecommerce')}
                disabled={isSameAsShipping}
              />
            </Grid>
            <TextField
              name="billing_address.postal_code"
              label={__('ZIP / Postal code', 'kirki-ecommerce')}
              type="number"
              placeholder={__('+1 (555) 222 4354', 'kirki-ecommerce')}
              disabled={isSameAsShipping}
            />
          </Flex>
        </Flex>
      </CardContent>
    </Card>
  );
};

BillingAddress.displayName = 'BillingAddress';

export default BillingAddress;
