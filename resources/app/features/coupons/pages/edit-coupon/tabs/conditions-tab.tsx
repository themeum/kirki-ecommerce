import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import NumberField from '@/components/form/number-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import type { CouponFormInput } from '@/features/coupons/schemas/forms/coupon-form';
import { InfoIcon } from '@/icons/common';
import { theme } from '@/theme';
import { mergeCss } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type ConditionRowProps = {
  checkboxName: 'has_usage_limit' | 'has_customer_limit' | 'is_combinable';
  inputName?: 'usage_limit' | 'customer_limit';
  label: string;
  tooltip: string;
};

const ConditionRow = ({ checkboxName, inputName, label, tooltip }: ConditionRowProps) => {
  const { control, formState, setFocus } = useFormContext<CouponFormInput>();
  const isEnabled = useWatch({ control, name: checkboxName });
  const shouldFocusRef = useRef(false);
  const hasNumberInput = isDefined(inputName);

  useEffect(() => {
    if (!isDefined(inputName)) {
      return;
    }
    if (isEnabled && shouldFocusRef.current) {
      shouldFocusRef.current = false;
      setFocus(inputName);
    }
  }, [isEnabled, inputName, setFocus]);

  return (
    <Flex direction="column" gap={2}>
      <Flex
        align="center"
        justify="space-between"
        gap={3}
        cssOverride={mergeCss(
          styles.row,
          hasNumberInput && formState.errors[inputName] ? styles.rowInvalid : {},
        )}
      >
        <Flex align="center" gap={2}>
          <CheckboxField
            name={checkboxName}
            label={label}
            onCheckedChange={(checked) => {
              shouldFocusRef.current = checked;
            }}
          />
          <Tooltip tip={tooltip}>
            <InfoIcon />
          </Tooltip>
        </Flex>
        {hasNumberInput && isEnabled && (
          <NumberField
            name={inputName}
            disabled={!isEnabled}
            cssOverride={styles.rowInput}
            showError={false}
            min={1}
          />
        )}
      </Flex>
      {hasNumberInput && <FieldError errors={[formState.errors[inputName]]} />}
    </Flex>
  );
};

const ConditionsTab = () => {
  return (
    <Card cssOverride={{ rowGap: theme.spacing[3] }}>
      <CardHeader>
        <CardTitle>{__('Usage Limit', 'kirki-ecommerce')}</CardTitle>
        <Text variant="small" color="secondary">
          {__('Limit the usage of the coupon', 'kirki-ecommerce')}
        </Text>
      </CardHeader>
      <CardContent>
        <Flex direction="column">
          <ConditionRow
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
          <ConditionRow
            checkboxName="has_customer_limit"
            inputName="customer_limit"
            label={__('Limit usage per customer', 'kirki-ecommerce')}
            tooltip={__(
              'Each customer can use this coupon up to this many times.',
              'kirki-ecommerce',
            )}
          />
          <Separator
            marginTop={theme.spacing[2]}
            marginBottom={theme.spacing[2]}
            color={theme.colors.border.tertiary}
          />
          <ConditionRow
            checkboxName="is_combinable"
            label={__('Combine with other discounts', 'kirki-ecommerce')}
            tooltip={__('This coupon can be used with other discounts.', 'kirki-ecommerce')}
          />
        </Flex>
      </CardContent>
    </Card>
  );
};

ConditionsTab.displayName = 'ConditionsTab';

export default ConditionsTab;

const styles = {
  row: {
    padding: `${theme.spacing[2]} ${theme.spacing[0]}`,
    border: '1px solid transparent',
    height: '40px',
  },
  rowInvalid: {
    borderColor: theme.colors.border.critical,
  },
  rowInput: {
    width: '72px',
    minHeight: '30px',
    flexShrink: 0,
  },
};
