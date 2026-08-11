import { useFormContext, useWatch } from 'react-hook-form';

import CountryField from '@/components/form/country-field';
import StateField from '@/components/form/state-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import { ShippingAddressIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const ShippingAddress = () => {
  const { control } = useFormContext();
  const country = useWatch({
    control,
    name: 'shipping_address.country',
  });

  return (
    <Card cssOverride={mergeCss(cardStyles.formCard, styles.roundedCard)}>
      <CardHeader>
        <Flex gap={2} align="center">
          <ShippingAddressIcon />
          <Text weight="semibold">
            {__('Shipping Address', 'kirki-ecommerce')}
          </Text>
        </Flex>
      </CardHeader>
      <Card cssOverride={cardStyles.innerCard}>
        <CardContent cssOverride={cardStyles.innerContent}>
          <Flex direction="column" gap={4}>
            <CountryField
              name="shipping_address.country"
              label={__('Country / Region', 'kirki-ecommerce')}
            />
            <TextField
              name="shipping_address.address_line1"
              label={__('Address', 'kirki-ecommerce')}
              placeholder={__('e.g. 124 main st', 'kirki-ecommerce')}
            />
            <TextField
              name="shipping_address.address_line2"
              label={__(
                'Apartment, suite, etc. (optional)',
                'kirki-ecommerce',
              )}
            />
            <Grid>
              <TextField
                name="shipping_address.city"
                label={__('City', 'kirki-ecommerce')}
              />
              <StateField
                country={country}
                name="shipping_address.state"
                label={__('State / Province', 'kirki-ecommerce')}
              />
            </Grid>
            <TextField
              name="shipping_address.postal_code"
              label={__('ZIP / Postal code', 'kirki-ecommerce')}
              placeholder={__('+1 (555) 222 4354', 'kirki-ecommerce')}
            />
          </Flex>
        </CardContent>
      </Card>
    </Card>
  );
};

ShippingAddress.displayName = 'ShippingAddress';

export default ShippingAddress;

const styles = defineStyles({
  roundedCard: {
    padding: theme.spacing[5],
    borderRadius: theme.radius.xl,
    gap: theme.spacing[5],
  },
});

