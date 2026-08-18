import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import RegionsField from '@/components/form/regions-field';
import SelectField from '@/components/form/select-field';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { CouponFormInput } from '@/features/coupons/schemas/forms/coupon-form';
import { CustomerSelectionField } from '@/features/customers';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const specificGroupsOption = {
  value: 'specific-groups',
  label: __('Specific customer group (Coming Soon)', 'kirki-ecommerce'),
  disabled: true,
};

const customerEligibilityOptions = [
  { value: 'none', label: __('None', 'kirki-ecommerce') },
  { value: 'all', label: __('All customers', 'kirki-ecommerce') },
  { value: 'specific-customers', label: __('Specific customers', 'kirki-ecommerce') },
  specificGroupsOption,
];

const TargetingTab = () => {
  const { control } = useFormContext<CouponFormInput>();
  const targetCountryType = useWatch({ control, name: 'target_country_type' });
  const customerIncludeEligibility = useWatch({ control, name: 'customer_include_eligibility' });
  const customerExcludeEligibility = useWatch({ control, name: 'customer_exclude_eligibility' });

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
      <Card cssOverride={cardStyles.formCard}>
        <CardContent>
          <Flex direction="column" gap={4}>
            <Flex direction="column" gap={2}>
              <Text variant="heading6" weight="semibold">{__('Include', 'kirki-ecommerce')}</Text>
              <Text variant="small">{__('Incorporate all customers or focus on particular segments or groups of customers.', 'kirki-ecommerce')}</Text>
            </Flex>
            <CheckboxField
              name="first_time_buyer_only"
              label={__('First time buyer only', 'kirki-ecommerce')}
            />
            <SelectField
              name="customer_include_eligibility"
              label={__('Select Specific Customers', 'kirki-ecommerce')}
              options={customerEligibilityOptions}
            />
            {customerIncludeEligibility === 'specific-customers' && (
              <CustomerSelectionField name="include_customers" />
            )}
          </Flex>
        </CardContent>
      </Card>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent>
          <Flex direction="column" gap={4}>
            <Flex direction="column" gap={2}>
              <Text variant="heading6" weight="semibold">{__('Exclude', 'kirki-ecommerce')}</Text>
              <Text variant="small">{__('Exclude specific customer groups or segments from receiving the coupon.', 'kirki-ecommerce')}</Text>
            </Flex>
            <SelectField
              name="customer_exclude_eligibility"
              label={__('Select Specific Customers', 'kirki-ecommerce')}
              options={customerEligibilityOptions}
            />
            {customerExcludeEligibility === 'specific-customers' && (
              <CustomerSelectionField name="exclude_customers" />
            )}
          </Flex>
        </CardContent>
      </Card>
    </Flex>
  );
};

TargetingTab.displayName = 'TargetingTab';

export default TargetingTab;
