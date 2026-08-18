import { useFormContext, useWatch } from 'react-hook-form';

import RegionsField from '@/components/form/regions-field';
import SelectField from '@/components/form/select-field';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { CouponFormInput } from '@/features/coupons/schemas/forms/coupon-form';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const TargetingTab = () => {
  const { control } = useFormContext<CouponFormInput>();
  const targetCountryType = useWatch({ control, name: 'target_country_type' });

  return (
    <Flex direction="column" gap={4}>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent>
          <Flex direction="column" gap={4}>
            <Flex direction="column" gap={2}>
              <Text variant="heading6" weight="semibold">{__('Countries', 'kirki-ecommerce')}</Text>
              <Text variant="small">{__('Choose the countries where you want the coupon to be applicable, or select all.', 'kirki-ecommerce')}</Text>
            </Flex>
            <SelectField
              name="target_country_type"
              label={__('Applies To', 'kirki-ecommerce')}
              options={[
                { value: 'all-countries', label: __('All Countries', 'kirki-ecommerce') },
                { value: 'specific-countries', label: __('Specific Countries', 'kirki-ecommerce') },
              ]}
            />
            {targetCountryType === 'specific-countries' && (
              <RegionsField
                name="target_countries"
                label={__('Select Countries', 'kirki-ecommerce')}
                placeholder={__('Type to add countries..', 'kirki-ecommerce')}
                emptyText={__('Added countries will appear here', 'kirki-ecommerce')}
              />
            )}
          </Flex>
        </CardContent>
      </Card>
    </Flex>
  );
};

TargetingTab.displayName = 'TargetingTab';

export default TargetingTab;
