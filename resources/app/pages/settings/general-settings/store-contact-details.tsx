import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
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
    <Card type="large">
      <Text
        header={__('Store Contact Details', 'kirki-ecommerce')}
        subHeader={__(
          "Set up your store's contact information",
          'kirki-ecommerce',
        )}
        type="primary"
        style={{ gap: 'var(--decom-spacing-f3)' }}
      />

      <Card type="inner" style={{ padding: 'var(--decom-spacing-4)' }}>
        <Flex direction="column" gap={16}>
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
      </Card>
    </Card>
  );
};

StoreContactDetails.displayName = 'StoreContactDetails';

export default StoreContactDetails;
