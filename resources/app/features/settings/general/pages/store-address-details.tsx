import { useWatch } from 'react-hook-form';

import CountryField from '@/components/form/country-field';
import StateField from '@/components/form/state-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import type { GeneralSettingsFormInput } from '@/features/settings/general/schemas/forms/general-settings-form';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const StoreAddressDetails = () => {
  const country = useWatch<GeneralSettingsFormInput, 'store_address.country'>({
    name: 'store_address.country',
  });

  return (
    <div>
      <Card cssOverride={cardStyles.formCard}>
        <CardHeader cssOverride={cardStyles.sectionHeader}>
          <CardTitle>{__('Store address', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              "Configure your store's physical address here.",
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent cssOverride={cardStyles.largeContent}>
          <Card cssOverride={cardStyles.innerCard}>
            <CardContent cssOverride={cardStyles.innerCardContent}>
              <Flex direction="column" gap={4}>
                <TextField
                  name="store_address.address_line_1"
                  label={__('Address Line 1', 'kirki-ecommerce')}
                  placeholder={__('Address line 1', 'kirki-ecommerce')}
                />

                <TextField
                  name="store_address.address_line_2"
                  label={__('Address Line 2', 'kirki-ecommerce')}
                  placeholder={__('Address line 2', 'kirki-ecommerce')}
                />

                <TextField
                  name="store_address.city"
                  label={__('City', 'kirki-ecommerce')}
                  placeholder={__('Enter city', 'kirki-ecommerce')}
                />

                <TextField
                  name="store_address.postal_code"
                  label={__('Postcode / Zip', 'kirki-ecommerce')}
                  placeholder={__('Enter Postcode / Zip', 'kirki-ecommerce')}
                />

                <CountryField
                  name="store_address.country"
                  label={__('Country', 'kirki-ecommerce')}
                />

                <StateField
                  name="store_address.state"
                  country={country}
                  label={__('State / Province', 'kirki-ecommerce')}
                />

              </Flex>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

StoreAddressDetails.displayName = 'StoreAddressDetails';

export default StoreAddressDetails;

