import { useFormContext, useWatch } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import CouponCodeField from '@/features/coupons/components/fields/coupon-code-field';
import DiscountTypeSelector from '@/features/coupons/pages/edit-coupon/components/contents/discount-type-selector';
import DiscountValueSection from '@/features/coupons/pages/edit-coupon/components/contents/discount-value-section';
import ValidityPeriodSection from '@/features/coupons/pages/edit-coupon/components/contents/validity-period-section';
import type { CouponFormInput } from '@/features/coupons/schemas/forms/coupon-form';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';


const DetailsTab = () => {
  const { control } = useFormContext<CouponFormInput>();
  const method = useWatch({ control, name: 'method' });
  const discountType = useWatch({ control, name: 'discount_type' });
  const isAmountOff = discountType === 'amount-off';

  return (
    <Flex direction="column" gap={4}>
      <Card cssOverride={cardStyles.formCard}>
        <CardHeader>
          <CardTitle>{__('Coupon Details', 'kirki-ecommerce')}</CardTitle>
          <Text variant="small" color="secondary">
            {__('Basic information about your coupon', 'kirki-ecommerce')}
          </Text>
        </CardHeader>
        <CardContent>
          <Flex direction="column" gap={4}>
            {/* TODO: Add method field later */}
            {/* <RadioGroupField
              name='method'
              cssOverride={styles.methodField}
              label={__('Method', 'kirki-ecommerce')}
              options={[
                {
                  label: __('Code', 'kirki-ecommerce'),
                  value: 'code',
                },
                {
                  label: __('Automatic', 'kirki-ecommerce'),
                  value: 'automatic',
                },
              ]}
            /> */}

            <Grid>
              <TextField
                name="title"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={__('e.g. Winter Fire', 'kirki-ecommerce')}
              />
              {method === 'code' && <CouponCodeField />}
            </Grid>

            <Field>
              <FieldLabel>{__('Discount Type', 'kirki-ecommerce')}</FieldLabel>
              <DiscountTypeSelector />
            </Field>

            {/* TODO: Add discount target field later */}
            {/* {isAmountOff && (
              <SelectField
                name="discount_target"
                label={__('Discount Target', 'kirki-ecommerce')}
                placeholder={__('Select target', 'kirki-ecommerce')}
                options={[
                  { value: 'products', label: __('Products', 'kirki-ecommerce') },
                  { value: 'order', label: __('Entire Order', 'kirki-ecommerce') },
                ]}
              />
            )} */}
          </Flex>
        </CardContent>
      </Card>

      {isAmountOff && <DiscountValueSection />}

      <ValidityPeriodSection />
    </Flex>
  );
};

DetailsTab.displayName = 'DetailsTab';

export default DetailsTab;
