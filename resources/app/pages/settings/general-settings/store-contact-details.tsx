import ThumbnailSelector from '@/components/thumbnail-selector';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Text from '@/molecules/text';
import type { FormErrors, MediaChangePayload } from '@/types';
import { __ } from '@/wpi18n';

import type { GeneralSettingsFormData } from '@/pages/settings/general-settings/utils';

type StoreContactDetailsProps = {
  dataObj: GeneralSettingsFormData | null;
  storeLogo: string;
  handleOnChange: (value: unknown, key: string) => void;
  errors: FormErrors;
};

const StoreContactDetails = (props: StoreContactDetailsProps) => {
  const { dataObj, storeLogo, handleOnChange, errors } = props;
  return (
    <>
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
            <Input
              label={__('Store Name', 'kirki-ecommerce')}
              placeholder={__('Enter your store name', 'kirki-ecommerce')}
              type="text"
              value={dataObj?.['store_name'] as string}
              onChange={(value) => handleOnChange(value, 'store_name')}
              error={errors['data.store_name'] as string | boolean | undefined}
            />

            <ThumbnailSelector
              label={__('Store Logo', 'kirki-ecommerce')}
              src={storeLogo}
              helpText={__('Set store logo', 'kirki-ecommerce')}
              onChange={(img) =>
                handleOnChange(img as MediaChangePayload, 'store_logo')
              }
              error={errors['data.store_logo'] as string | boolean | undefined}
            />

            <Input
              label={__('Store Email', 'kirki-ecommerce')}
              placeholder={__('Enter your store email', 'kirki-ecommerce')}
              type="text"
              value={dataObj?.['store_email'] as string}
              onChange={(value) => handleOnChange(value, 'store_email')}
              error={errors['data.store_email'] as string | boolean | undefined}
            />

            <Input
              label={__('Store Phone', 'kirki-ecommerce')}
              placeholder={__('Enter your store phone', 'kirki-ecommerce')}
              value={dataObj?.['store_phone'] as string}
              onChange={(value) => handleOnChange(value, 'store_phone')}
              error={errors['data.store_phone'] as string | boolean | undefined}
            />
          </Flex>
        </Card>
      </Card>
    </>
  );
};

export default StoreContactDetails;
