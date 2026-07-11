import CountrySelector from '@/components/country-selector';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Text from '@/molecules/text';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import type { GeneralSettingsFormData } from './utils';

type StoreAddressDetailsProps = {
  dataObj: GeneralSettingsFormData | null;
  handleOnChange: (value: unknown, key: string) => void;
  errors: FormErrors;
};

const StoreAddressDetails = (props: StoreAddressDetailsProps) => {
  const { dataObj, handleOnChange, errors } = props;
  return (
    <div>
      <Card type="large">
        <Text
          header={__('Store address', 'kirki-ecommerce')}
          subHeader={__(
            "Configure your store's physical address here.",
            'kirki-ecommerce',
          )}
          type="primary"
          style={{ gap: 'var(--decom-spacing-f3)' }}
        />

        <Card type="inner" style={{ padding: 'var(--decom-spacing-4)' }}>
          <Flex direction="column" gap={16}>
            <Input
              label={__('Address Line 1', 'kirki-ecommerce')}
              placeholder={__('Address line 1', 'kirki-ecommerce')}
              value={dataObj?.['store_address']?.['address_line_1'] as string}
              type="text"
              onChange={(value) => handleOnChange(value, 'address_line_1')}
              error={errors['data.address_line_1'] as string | boolean | undefined}
            />

            <Input
              label={__('Address Line 2', 'kirki-ecommerce')}
              placeholder={__('Address line 2', 'kirki-ecommerce')}
              type="text"
              value={dataObj?.['store_address']?.['address_line_2'] as string}
              onChange={(value) => handleOnChange(value, 'address_line_2')}
              error={errors['data.address_line_2'] as string | boolean | undefined}
            />

            <Input
              label={__('City', 'kirki-ecommerce')}
              placeholder={__('Enter city', 'kirki-ecommerce')}
              type="text"
              value={dataObj?.['store_address']?.['city'] as string}
              onChange={(value) => handleOnChange(value, 'city')}
              error={errors['data.city'] as string | boolean | undefined}
            />

            <Input
              label={__('Postcode / Zip', 'kirki-ecommerce')}
              placeholder={__('Enter Postcode / Zip', 'kirki-ecommerce')}
              type="text"
              value={dataObj?.['store_address']?.['zip_code'] as string}
              onChange={(value) => handleOnChange(value, 'zip_code')}
              error={errors['data.zip_code'] as string | boolean | undefined}
            />

            <CountrySelector
              label={__('Country', 'kirki-ecommerce')}
              value={dataObj?.['store_address']?.['country'] as string}
              onChange={(value) => handleOnChange(value, 'country')}
              error={errors['data.country'] as string | boolean | undefined}
            />
          </Flex>
        </Card>
      </Card>
    </div>
  );
};

export default StoreAddressDetails;
