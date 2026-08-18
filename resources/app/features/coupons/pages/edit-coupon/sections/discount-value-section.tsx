import { useFormContext, useWatch } from 'react-hook-form';

import CategoriesDropdownField from '@/components/form/categories-dropdown-field';
import NumberField from '@/components/form/number-field';
import SelectField from '@/components/form/select-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import { useCategoriesQuery } from '@/features/categories';
import ProductSelectionField from '@/features/coupons/components/fields/product-selection-field';
import type { CouponFormInput } from '@/features/coupons/schemas/forms/coupon-form';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const DiscountValueSection = () => {
  const { control } = useFormContext<CouponFormInput>();
  const discountValueType = useWatch({
    name: 'discount_value_type',
    control,
  })
  const discountTarget = useWatch({ control, name: 'discount_target' });
  const eligibleItemType = useWatch({ control, name: 'eligible_item_type' });
  const { data: categoryData } = useCategoriesQuery(
    { limit: -1 },
    eligibleItemType === 'specific-categories',
  );
  const categories = categoryData?.results ?? [];
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
          <Field>
            {discountTarget === 'products' && (
              <>
                <SelectField
                  name="eligible_item_type"
                  label={__('Eligible Items', 'kirki-ecommerce')}
                  placeholder={__('Select eligible items', 'kirki-ecommerce')}
                  options={[
                    { value: 'all-products', label: __('All Products', 'kirki-ecommerce') },
                    { value: 'specific-products', label: __('Specific Products', 'kirki-ecommerce') },
                    { value: 'specific-categories', label: __('Specific Categories', 'kirki-ecommerce') },
                  ]}
                />
                {eligibleItemType === 'specific-products' && <ProductSelectionField />}
                {eligibleItemType === 'specific-categories' && (
                  <CategoriesDropdownField
                    name="categories"
                    categories={categories}
                    label={__('Categories', 'kirki-ecommerce')}
                    placeholder={__('Search categories..', 'kirki-ecommerce')}
                  />
                )}
              </>
            )}
          </Field>
        </Flex>
      </CardContent>
    </Card>
  )
};

export default DiscountValueSection
