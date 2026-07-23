import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
        css={styles.sectionHeader}
      />

      <Card type="inner" css={styles.innerCard}>
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

const styles = {
  sectionHeader: scoped({
    gap: theme.spacing.base,
  }),
  innerCard: scoped({
    padding: theme.spacing['2xl'],
  }),
};
