import CountrySelector from '@/components/country-selector';
import { ShippingAddressIcon } from '@/icons';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import Text from '@/molecules/text';
import type { CustomerFormData, FormErrors } from '@/types';
import { __ } from '@/wpi18n';

type ShippingAddressProps = {
  customerFormData: CustomerFormData;
  errors: FormErrors;
  handleOnChange: (
    data: unknown,
    fieldName: string,
    subFieldName?: string,
  ) => void;
};

const ShippingAddress = ({
  customerFormData,
  errors,
  handleOnChange,
}: ShippingAddressProps) => {
  return (
    <Card
      type="form"
      style={{ padding: '20px', borderRadius: '20px', gap: '20px' }}
    >
      <Text
        header={__('Shipping Address', 'kirki-ecommerce')}
        type="primary"
        leftIcon={<ShippingAddressIcon />}
      />
      <Card type="inner" style={{ padding: '16px' }}>
        <Flex direction="column" gap={16}>
          <CountrySelector
            label={__('Country / Region', 'kirki-ecommerce')}
            value={customerFormData?.shipping_address?.country}
            onChange={(value) =>
              handleOnChange(value, 'shipping_address', 'country')
            }
            error={
              errors['shipping_address.country'] as
                | string
                | boolean
                | undefined
            }
          />
          <Input
            label={__('Address', 'kirki-ecommerce')}
            value={customerFormData?.shipping_address?.address_line1}
            placeholder={__('e.g. 124 main st', 'kirki-ecommerce')}
            onChange={(value) =>
              handleOnChange(value, 'shipping_address', 'address_line1')
            }
            error={
              errors['shipping_address.address_line1'] as
                | string
                | boolean
                | undefined
            }
          />
          <Input
            label={__('Apartment, suite, etc. (optional)', 'kirki-ecommerce')}
            value={customerFormData?.shipping_address?.address_line2 ?? ''}
            onChange={(value) =>
              handleOnChange(value, 'shipping_address', 'address_line2')
            }
            error={
              errors['shipping_address.address_line2'] as
                | string
                | boolean
                | undefined
            }
          />
          <Grid>
            <Input
              label={__('City', 'kirki-ecommerce')}
              value={customerFormData?.shipping_address?.city}
              onChange={(value) =>
                handleOnChange(value, 'shipping_address', 'city')
              }
              error={
                errors['shipping_address.city'] as
                  | string
                  | boolean
                  | undefined
              }
            />
            <Input
              label={__('State / Province', 'kirki-ecommerce')}
              value={customerFormData?.shipping_address?.state}
              onChange={(value) =>
                handleOnChange(value, 'shipping_address', 'state')
              }
              error={
                errors['shipping_address.state'] as
                  | string
                  | boolean
                  | undefined
              }
            />
          </Grid>
          <Input
            label={__('ZIP / Postal code', 'kirki-ecommerce')}
            value={customerFormData?.shipping_address?.postal_code}
            placeholder={__('+1 (555) 222 4354', 'kirki-ecommerce')}
            onChange={(value) =>
              handleOnChange(value, 'shipping_address', 'postal_code')
            }
            error={
              errors['shipping_address.postal_code'] as
                | string
                | boolean
                | undefined
            }
          />
        </Flex>
      </Card>
    </Card>
  );
};

export default ShippingAddress;
