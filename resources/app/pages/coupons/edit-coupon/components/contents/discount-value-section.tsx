import { useFormContext, useWatch } from 'react-hook-form';

import NumberField from '@/components/form/number-field';
import SelectField from '@/components/form/select-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import type { CouponFormInput } from '@/schemas/forms/coupon-form';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const DiscountValueSection = () => {
  const { control } = useFormContext<CouponFormInput>();
  const discountValueType = useWatch({
    name: 'discount_value_type',
    control,
  })
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Discount Value', 'kirki-ecommerce')}</CardTitle>
        <Text variant="small" color="secondary">
          {__(
            'Select your desired discount option and specify the value.',
            'kirki-ecommerce',
          )}
        </Text>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={4}>
          <Grid>
            <SelectField
              name="discount_value_type"
              label={__('Discount', 'kirki-ecommerce')}
              placeholder={__('Select type', 'kirki-ecommerce')}
              options={[
                { value: 'percentage', label: __('Percentage', 'kirki-ecommerce') },
                { value: 'fixed', label: __('Fixed Amount', 'kirki-ecommerce') },
              ]}
            />
            <NumberField
              name="discount_amount"
              label={__('Value', 'kirki-ecommerce')}
              placeholder={__('e.g. 25', 'kirki-ecommerce')}
              min={0}
              max={discountValueType === 'percentage' ? 100 : null}
            />
          </Grid>

          {/* TODO: Add eligible items field later */}
          {/* <Field>
            <Flex justify="space-between" align="center">
              <FieldLabel>{__('Eligible Items', 'kirki-ecommerce')}</FieldLabel>
              <Badge variant="secondary">{__('Coming soon', 'kirki-ecommerce')}</Badge>
            </Flex>
            <Select disabled defaultValue="specific-products">
              <SelectTrigger disabled>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="specific-products">
                  {__('Specific Products', 'kirki-ecommerce')}
                </SelectItem>
              </SelectContent>
            </Select>
            <Placeholder type="primary">
              <ThumbnailPlaceholder />
            </Placeholder>
            <Button type="button" variant="secondary" disabled css={styles.selectProductsButton}>
              {__('Select Products', 'kirki-ecommerce')}
            </Button>
          </Field> */}
        </Flex>
      </CardContent>
    </Card>
  )
};


// const styles = {
//   selectProductsButton: scoped({
//     width: '100%',
//   }),
// };

export default DiscountValueSection
