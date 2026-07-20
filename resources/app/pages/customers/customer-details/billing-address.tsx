import { useFormContext } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Checkbox from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CLASS_PREFIX } from '@/conf';
import { PaymentIcon } from '@/icons';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Text from '@/molecules/text';
import type { CustomerFormValues } from '@/schemas/forms/customer-form';
import { __ } from '@/wpi18n';

const regionOptions = [
  { value: 'bangladesh', label: 'Bangladesh' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'usa', label: 'United States' },
  { value: 'spain', label: 'Spain' },
];

const BillingAddress = () => {
  const { watch, setValue, control } = useFormContext<CustomerFormValues>();
  const isSameAsShipping = Boolean(watch('is_billing_same_as_shipping'));

  return (
    <Card
      type="form"
      style={{ padding: '20px', borderRadius: '20px', gap: '20px' }}
    >
      <Text
        header={__('Billing Address', 'kirki-ecommerce')}
        type="primary"
        leftIcon={<PaymentIcon />}
        style={{ paddingBottom: '4px' }}
      />
      <Flex direction="column" gap={8}>
        <Card type="innerDark">
          <FormField
            control={control}
            name="is_billing_same_as_shipping"
            render={({ field }) => (
              <FormItem>
                <div className={`${CLASS_PREFIX}-ui-checkbox-field`}>
                  <FormControl>
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => {
                        const nextValue = checked === true;
                        field.onChange(nextValue);
                        if (nextValue) {
                          setValue('billing_address', {});
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel>Same as shipping address</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>
        <Card type="inner" style={{ padding: '16px' }}>
          <Flex direction="column" gap={16}>
            <SelectField
              name="billing_address.country"
              label={__('Country / Region', 'kirki-ecommerce')}
              options={regionOptions}
              placeholder="Bangladesh"
              disabled={isSameAsShipping}
            />
            <TextField
              name="billing_address.address_line1"
              label={__('Address', 'kirki-ecommerce')}
              placeholder={__('e.g. 124 main st', 'kirki-ecommerce')}
              disabled={isSameAsShipping}
            />
            <TextField
              name="billing_address.address_line2"
              label={__(
                'Apartment, suite, etc. (optional)',
                'kirki-ecommerce',
              )}
              disabled={isSameAsShipping}
            />
            <Grid>
              <TextField
                name="billing_address.city"
                label={__('City', 'kirki-ecommerce')}
                disabled={isSameAsShipping}
              />
              <TextField
                name="billing_address.state"
                label={__('State / Province', 'kirki-ecommerce')}
                disabled={isSameAsShipping}
              />
            </Grid>
            <TextField
              name="billing_address.postal_code"
              label={__('ZIP / Postal code', 'kirki-ecommerce')}
              type="number"
              placeholder={__('+1 (555) 222 4354', 'kirki-ecommerce')}
              disabled={isSameAsShipping}
            />
          </Flex>
        </Card>
      </Flex>
    </Card>
  );
};

BillingAddress.displayName = 'BillingAddress';

export default BillingAddress;
