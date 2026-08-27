import MediaField from '@/components/form/media-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const StoreContactDetails = () => {
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader cssOverride={cardStyles.sectionHeader}>
        <CardTitle>{__('Store Contact Details', 'kirki-ecommerce')}</CardTitle>
        <CardDescription>
          {__(
            "Set up your store's contact information",
            'kirki-ecommerce',
          )}
        </CardDescription>
      </CardHeader>
      <CardContent cssOverride={cardStyles.largeContent}>
        <Card cssOverride={cardStyles.innerCard}>
          <CardContent cssOverride={cardStyles.innerCardContent}>
            <Flex direction="column" gap={4}>
              <TextField
                name="store_name"
                label={__('Store Name', 'kirki-ecommerce')}
                placeholder={__('Enter your store name', 'kirki-ecommerce')}
              />

              <MediaField
                name="store_logo"
                label={__('Store Logo', 'kirki-ecommerce')}
                infoText={__(
                  'Shown on your storefront, invoices and emails.',
                  'kirki-ecommerce',
                )}
                btnText={__('Upload logo', 'kirki-ecommerce')}
                placeholder={__(
                  'Supported formats: SVG, PNG, JPG. Maximum file size: 200KB',
                  'kirki-ecommerce',
                )}
              />

              <TextField
                name="store_email"
                label={__('Store Email', 'kirki-ecommerce')}
                placeholder={__('Enter your store email', 'kirki-ecommerce')}
              />

              <TextField
                name="store_phone"
                label={__('Store Phone', 'kirki-ecommerce')}
                placeholder={__('Enter your store phone', 'kirki-ecommerce')}
              />
            </Flex>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

StoreContactDetails.displayName = 'StoreContactDetails';

export default StoreContactDetails;

