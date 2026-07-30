import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

type StoreContactDetailsProps = {
  storeLogoUrl: string | null;
  onStoreLogoPreviewChange: (url: string | null) => void;
};

const StoreContactDetails = ({
  storeLogoUrl,
  onStoreLogoPreviewChange,
}: StoreContactDetailsProps) => {
  return (
    <Card cssOverride={cardStyles.largeCard}>
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

              <ThumbnailField
                name="store_logo"
                label={__('Store Logo', 'kirki-ecommerce')}
                description={__('Set store logo', 'kirki-ecommerce')}
                valueAs="id"
                previewUrl={storeLogoUrl}
                onPreviewChange={onStoreLogoPreviewChange}
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

