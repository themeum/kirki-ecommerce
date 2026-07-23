import CountryField from '@/components/form/country-field';
import TextField from '@/components/form/text-field';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { ShippingAddressIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const ShippingAddress = () => {
  return (
    <Card
      css={styles.formCard}
      style={{ padding: '20px', borderRadius: '20px', gap: '20px' }}
    >
      <CardHeader>
        <Text
          header={__('Shipping Address', 'kirki-ecommerce')}
          type="primary"
          leftIcon={<ShippingAddressIcon />}
        />
      </CardHeader>
      <Card css={styles.innerCard}>
        <CardContent css={styles.innerContent}>
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
        </CardContent>
      </Card>
    </Card>
  );
};

ShippingAddress.displayName = 'ShippingAddress';

export default ShippingAddress;

const styles = {
  formCard: scoped({
    rowGap: theme.spacing['2xl'],
  }),
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({
    padding: theme.spacing.lg,
  }),
};
