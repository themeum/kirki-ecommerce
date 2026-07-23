import CountryField from '@/components/form/country-field';
import TextField from '@/components/form/text-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const StoreAddressDetails = () => {
  return (
    <div>
      <Card css={styles.largeCard}>
        <CardHeader css={styles.sectionHeader}>
          <CardTitle>{__('Store address', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              "Configure your store's physical address here.",
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent css={styles.largeContent}>
          <Card css={styles.innerCard}>
            <CardContent css={styles.innerCardContent}>
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
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

StoreAddressDetails.displayName = 'StoreAddressDetails';

export default StoreAddressDetails;

const styles = {
  largeCard: scoped({
    gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({
    paddingInline: theme.spacing['3xl'],
  }),
  sectionHeader: scoped({
    gap: theme.spacing.base,
    paddingInline: theme.spacing['3xl'],
  }),
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerCardContent: scoped({
    padding: theme.spacing['2xl'],
  }),
};
