import type { Dispatch, SetStateAction } from 'react';

import Input from '@/molecules/input';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

type SocialShareProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
};

const SocialShare = (_props: SocialShareProps) => {
  return (
    <>
      Image
      <Input
        label={__('Title', 'kirki-ecommerce')}
        placeholder={__('e.g. Example T-shirt', 'kirki-ecommerce')}
        type="text"
      />
      <Input
        label={__('Meta description', 'kirki-ecommerce')}
        placeholder={__('e.g. Cotton shirts from our store.', 'kirki-ecommerce')}
        multiline={5}
      />
    </>
  );
};

SocialShare.displayName = 'SocialShare';

export default SocialShare;
