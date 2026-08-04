import TextareaField from '@/components/form/textarea-field';
import TextField from '@/components/form/text-field';
import { FieldGroup } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import SocialSharePreview from '@/pages/products/product-form/sections/seo-settings/social-share-preview';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const SocialShare = () => {
  return (
    <Flex direction="column" gap={4}>
      <SocialSharePreview />
      <Separator cssOverride={styles.separator} />
      <FieldGroup>
        <TextField
          name="og_title"
          label={__('Title', 'kirki-ecommerce')}
          placeholder={__('e.g. Example T-shirt', 'kirki-ecommerce')}
        />
        <TextareaField
          name="og_description"
          label={__('Meta description', 'kirki-ecommerce')}
          placeholder={__('e.g. Cotton shirts from our store.', 'kirki-ecommerce')}
          rows={5}
        />
      </FieldGroup>
    </Flex>
  );
};

SocialShare.displayName = 'SocialShare';

export default SocialShare;

const styles = defineStyles({
  separator: {
    marginInline: `-${theme.spacing[4]}`,
    width: `calc(100% + ${theme.spacing[4]} + ${theme.spacing[4]})`,
    backgroundColor: theme.colors.background.surfaceSubdued,
  },
});
