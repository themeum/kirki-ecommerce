import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import { InfoIcon } from '@/icons';
import type { CouponFormInput } from '@/schemas/forms/coupon-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const combinationOptions = [
  { id: 'amount-off', label: __('Amount off discounts', 'kirki-ecommerce') },
  { id: 'order', label: __('Order discounts', 'kirki-ecommerce') },
  { id: 'shipping', label: __('Shipping discounts', 'kirki-ecommerce') },
];

type UsageLimitRowProps = {
  checkboxName: 'has_usage_limit' | 'has_customer_limit';
  inputName: 'usage_limit' | 'customer_limit';
  label: string;
  tooltip: string;
};

const UsageLimitRow = ({
  checkboxName,
  inputName,
  label,
  tooltip,
}: UsageLimitRowProps) => {
  const { control, formState } = useFormContext<CouponFormInput>();
  const isEnabled = useWatch({ control, name: checkboxName });

  return (
    <Flex direction="column" gap={2}>
      <Flex
        align="center"
        justify="space-between"
        gap={3}
        cssOverride={{ ...styles.row, ...(formState.errors[inputName] ? styles.rowInvalid : {}) }}
      >
        <Flex align="center" gap={2}>
          <CheckboxField
            name={checkboxName}
            label={label}
          />
          <Tooltip tip={tooltip}>
            <InfoIcon />
          </Tooltip>
        </Flex>
        <TextField
          name={inputName}
          disabled={!isEnabled}
          cssOverride={styles.rowInput}
        />
      </Flex>
    </Flex>
  );
};

const ConditionsTab = () => (
  <Flex direction="column" gap={4}>
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Usage Limit', 'kirki-ecommerce')}</CardTitle>
        <Text variant="small" color="secondary">
          {__('Limit the usage of the coupon', 'kirki-ecommerce')}
        </Text>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={3}>
          <UsageLimitRow
            checkboxName="has_usage_limit"
            inputName="usage_limit"
            label={__(
              'Limit number of times this discount can be used in total',
              'kirki-ecommerce',
            )}
            tooltip={__(
              'Once this limit is reached, the coupon can no longer be used.',
              'kirki-ecommerce',
            )}
          />
          <UsageLimitRow
            checkboxName="has_customer_limit"
            inputName="customer_limit"
            label={__('Limit usage per customer', 'kirki-ecommerce')}
            tooltip={__(
              'Each customer can use this coupon up to this many times.',
              'kirki-ecommerce',
            )}
          />
        </Flex>
      </CardContent>
    </Card>

    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Combinations', 'kirki-ecommerce')}</CardTitle>
        <Text variant="small" color="secondary">
          {__(
            'Define how the coupon can be combined with other coupons',
            'kirki-ecommerce',
          )}
        </Text>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={3}>
          {combinationOptions.map((option) => {
            const optionId = `combination-${option.id}`;

            return (
              <Field key={option.id} orientation="horizontal">
                <Checkbox id={optionId} checked={false} disabled />
                <FieldLabel htmlFor={optionId}>{option.label}</FieldLabel>
              </Field>
            );
          })}
        </Flex>
      </CardContent>
    </Card>
  </Flex>
);

ConditionsTab.displayName = 'ConditionsTab';

export default ConditionsTab;

const styles = {
  row: {
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: '1px solid transparent',
  },
  rowInvalid: {
    borderColor: theme.colors.border.critical,
  },
  rowInput: {
    width: '72px',
    flexShrink: 0,
  },
  required: {
    marginLeft: theme.spacing[1],
    color: theme.colors.text.critical,
  },
};
