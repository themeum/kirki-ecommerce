import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import TextareaField from '@/components/form/textarea-field';
import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import type { ProductSeoFormValues } from '@/schemas/forms/product-seo-form';
import type { MediaRef } from '@/types';
import { __ } from '@/wpi18n';

const SocialShare = () => {
  const { getValues } = useFormContext<ProductSeoFormValues>();
  const initialOgImage = getValues('og_image');
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(
    initialOgImage && typeof initialOgImage === 'object'
      ? (initialOgImage as MediaRef).url ?? null
      : null,
  );

  return (
    <>
      <ThumbnailField
        name="og_image"
        label={__('Image', 'kirki-ecommerce')}
        valueAs="object"
        previewUrl={ogImageUrl}
        onPreviewChange={setOgImageUrl}
      />
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
    </>
  );
};

SocialShare.displayName = 'SocialShare';

export default SocialShare;
