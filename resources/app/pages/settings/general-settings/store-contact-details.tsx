import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
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

type StoreContactDetailsProps = {
  storeLogoUrl: string | null;
  onStoreLogoPreviewChange: (url: string | null) => void;
};

const StoreContactDetails = ({
  storeLogoUrl,
  onStoreLogoPreviewChange,
}: StoreContactDetailsProps) => {
  return (
    <Card css={styles.largeCard}>
      <CardHeader css={styles.sectionHeader}>
        <CardTitle>{__('Store Contact Details', 'kirki-ecommerce')}</CardTitle>
        <CardDescription>
          {__(
            "Set up your store's contact information",
            'kirki-ecommerce',
          )}
        </CardDescription>
      </CardHeader>
      <CardContent css={styles.largeContent}>
        <Card css={styles.innerCard}>
          <CardContent css={styles.innerCardContent}>
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
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

StoreContactDetails.displayName = 'StoreContactDetails';

export default StoreContactDetails;

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
