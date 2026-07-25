import { useFormContext } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormFieldRow,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PaymentIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import type { CustomerFormValues } from '@/schemas/forms/customer-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { scoped } from '@/theme/mixins';
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
    <Card css={[cardStyles.formCard, styles.roundedCard]}>
      <CardHeader>
        <Flex gap={2} align="center">
          <PaymentIcon />
          <Text weight="semibold" css={styles.header}>{__('Billing Address', 'kirki-ecommerce')}</Text>
        </Flex>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={2}>
          <Card css={cardStyles.innerDarkCard}>
            <CardContent css={cardStyles.innerDarkContent}>
              <FormField
                control={control}
                name="is_billing_same_as_shipping"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldRow>
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
                    </FormFieldRow>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <Card css={cardStyles.innerCard}>
            <CardContent css={cardStyles.innerContent}>
              <Flex direction="column" gap={4}>
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
            </CardContent>
          </Card>
        </Flex>
      </CardContent>
    </Card>
  );
};

BillingAddress.displayName = 'BillingAddress';

export default BillingAddress;

const styles = {
  roundedCard: scoped({
    padding: theme.spacing[5],
    borderRadius: theme.radius.xl,
    gap: theme.spacing[5],
  }),
  header: scoped({
    paddingBottom: theme.spacing[1],
  }),
};

