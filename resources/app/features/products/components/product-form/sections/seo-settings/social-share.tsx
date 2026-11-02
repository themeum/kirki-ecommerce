import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import SocialSharePreview from '@/features/products/components/product-form/sections/seo-settings/social-share-preview';
import { __ } from '@/wpi18n';

const SocialShare = () => {
  return (
    <Flex direction="column" gap={4}>
      <SocialSharePreview />
      <Separator negativeMargin={16} />
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
    </Flex>
  );
};

SocialShare.displayName = 'SocialShare';

export default SocialShare;
