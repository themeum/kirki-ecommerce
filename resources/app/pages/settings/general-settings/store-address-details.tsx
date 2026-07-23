import CountryField from '@/components/form/country-field';
import TextField from '@/components/form/text-field';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const StoreAddressDetails = () => {
  return (
    <div>
      <Card type="large">
        <Text
          header={__('Store address', 'kirki-ecommerce')}
          subHeader={__(
            "Configure your store's physical address here.",
            'kirki-ecommerce',
          )}
          type="primary"
          css={styles.sectionHeader}
        />

        <Card type="inner" css={styles.innerCard}>
          <Flex direction="column" gap={16}>
            <TextField
              name="store_address.address_line_1"
              label={__('Address Line 1', 'kirki-ecommerce')}
              placeholder={__('Address line 1', 'kirki-ecommerce')}
            />

            <TextField
              name="store_address.address_line_2"
              label={__('Address Line 2', 'kirki-ecommerce')}
              placeholder={__('Address line 2', 'kirki-ecommerce')}
            />

            <TextField
              name="store_address.city"
              label={__('City', 'kirki-ecommerce')}
              placeholder={__('Enter city', 'kirki-ecommerce')}
            />

            <TextField
              name="store_address.zip_code"
              label={__('Postcode / Zip', 'kirki-ecommerce')}
              placeholder={__('Enter Postcode / Zip', 'kirki-ecommerce')}
            />

            <CountryField
              name="store_address.country"
              label={__('Country', 'kirki-ecommerce')}
            />
          </Flex>
        </Card>
      </Card>
    </div>
  );
};

StoreAddressDetails.displayName = 'StoreAddressDetails';

export default StoreAddressDetails;

const styles = {
  sectionHeader: scoped({
    gap: theme.spacing.base,
  }),
  innerCard: scoped({
    padding: theme.spacing['2xl'],
  }),
};
