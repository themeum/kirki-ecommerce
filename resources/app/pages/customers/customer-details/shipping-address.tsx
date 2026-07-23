import CountryField from '@/components/form/country-field';
import TextField from '@/components/form/text-field';
import { Card } from '@/components/ui/card';
import { ShippingAddressIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import { __ } from '@/wpi18n';

const ShippingAddress = () => {
  return (
    <Card
      type="form"
      style={{ padding: '20px', borderRadius: '20px', gap: '20px' }}
    >
      <Text
        header={__('Shipping Address', 'kirki-ecommerce')}
        type="primary"
        leftIcon={<ShippingAddressIcon />}
      />
      <Card type="inner" style={{ padding: '16px' }}>
        <Flex direction="column" gap={16}>
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
            <TextField
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
      </Card>
    </Card>
  );
};

ShippingAddress.displayName = 'ShippingAddress';

export default ShippingAddress;
