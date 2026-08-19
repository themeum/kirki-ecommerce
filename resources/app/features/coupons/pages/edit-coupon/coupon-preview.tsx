import { Copy } from 'lucide-react';
import { useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { mergeDateTime } from '@/features/coupons/lib/coupon-datetime';
import type { CouponFormInput } from '@/features/coupons/schemas/forms/coupon-form';
import { DATE_FORMATS, END_OF_DAY_TIME, formatDateValue, START_OF_DAY_TIME } from '@/libs/date';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

const formatDisplayDate = (date?: string | null, time?: string | null): string | null => formatDateValue(mergeDateTime(date ?? '', time ?? ''), DATE_FORMATS.HUMAN_READABLE_WITH_TIME);

type PreviewSectionProps = {
  title: string;
  lines?: string[];
};

const PreviewSection = ({ title, lines }: PreviewSectionProps) => (
  <Flex direction="column" gap={1}>
    <Text variant="small" color="secondary" weight="semibold">
      {title}
    </Text>
    {lines && lines.length > 0 ? (
      <Flex direction="column" gap={1}>
        {lines.filter(Boolean).map((line) => (
          <Text key={line} variant="small">
            {`• ${line}`}
          </Text>
        ))}
      </Flex>
    ) : (
      <Text variant="tiny" weight="normal" cssOverride={styles.emptySection}>{__('Not set yet', 'kirki-ecommerce')}</Text>
    )}
  </Flex>
);

PreviewSection.displayName = 'PreviewSection';

const CouponPreview = () => {
  const { control } = useFormContext<CouponFormInput>();
  const values = useWatch({ control });

  const isAmountOff = values.discount_type === 'amount-off';
  const hasDiscountAmount = isAmountOff && Boolean(values.discount_amount);
  const isPercentage = values.discount_value_type === 'percentage';

  const handleCopyCode = async () => {
    if (!values.code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(values.code);
      toast.success(__('Coupon code copied', 'kirki-ecommerce'));
    } catch {
      toast.error(__('Failed to copy coupon code', 'kirki-ecommerce'));
    }
  };

  const validUntil =
    values.has_end_datetime && values.end_date
      ? formatDisplayDate(values.end_date, values.end_time ?? END_OF_DAY_TIME)
      : null;

  const typeLines = [
    values.discount_type === 'free-shipping'
      ? __('Free shipping', 'kirki-ecommerce')
      : values.discount_type === 'buy-x-get-y'
        ? __('Buy X Get Y', 'kirki-ecommerce')
        : __('Amount off', 'kirki-ecommerce'),
    ...(isAmountOff
      ? [
        values.discount_target === 'products'
          ? __('Product discount', 'kirki-ecommerce')
          : __('Order discount', 'kirki-ecommerce'),
      ]
      : []),
  ];

  const activeFrom = formatDisplayDate(
    values?.start_date,
    values.start_time ?? START_OF_DAY_TIME,
  );
  const detailsLines = [
    hasDiscountAmount
      // TODO: Add currency formatter to show discount amount
      ? `${values.discount_amount}${isPercentage ? '%' : ''} ${__('off', 'kirki-ecommerce')} ${values.discount_target === 'products'
        ? __('selected products', 'kirki-ecommerce')
        : __('entire order', 'kirki-ecommerce')
      }`
      : __('Discount value not set yet', 'kirki-ecommerce'),
    activeFrom
      ? `${__('Active from', 'kirki-ecommerce')} ${activeFrom}`
      : __('Start date not set yet', 'kirki-ecommerce'),
  ];

  const includeCustomerEligibility = useCallback(() => {
    switch (values.customer_include_eligibility) {
      case 'all-customers':
        return __('Included all customers', 'kirki-ecommerce');
      case 'specific-customers':
        return __('Included specific customers', 'kirki-ecommerce');
      case 'specific-groups':
        return __('Included specific groups', 'kirki-ecommerce');
      case 'guests':
        return __('Included only guests', 'kirki-ecommerce');
      case 'everyone':
        return __('Included everyone', 'kirki-ecommerce');
      default:
        return '';
    }
  }, [values.customer_include_eligibility]);

  const excludeCustomerEligibility = useCallback(() => {
    switch (values.customer_exclude_eligibility) {
      case 'all-customers':
        return __('Excluded all customers', 'kirki-ecommerce');
      case 'specific-customers':
        return __('Excluded specific customers', 'kirki-ecommerce');
      case 'specific-groups':
        return __('Excluded specific groups', 'kirki-ecommerce');
      case 'guests':
        return __('Excluded only guests', 'kirki-ecommerce');
      default:
        return '';
    }
  }, [values.customer_exclude_eligibility]);

  const targetingLines = [
    values.target_country_type === 'specific-countries' ?
      __('Specific countries', 'kirki-ecommerce')
      : __('All countries', 'kirki-ecommerce'),
    includeCustomerEligibility(),
    excludeCustomerEligibility(),
  ];

  const conditionsLines = [
    values.has_usage_limit && values.usage_limit
      ? sprintf(_n('Limited to %s use', 'Limited to %s uses', values.usage_limit, 'kirki-ecommerce'), values.usage_limit)
      : __('No usage limits', 'kirki-ecommerce'),
    values.has_customer_limit && values.customer_limit
      ? sprintf(_n('Limited to %s customer', 'Limited to %s customers', values.customer_limit, 'kirki-ecommerce'), values.customer_limit)
      : __('No customer limits', 'kirki-ecommerce'),
  ];

  return (
    <Flex direction="column">
      <Card cssOverride={{ ...{ borderStyle: 'dashed', borderColor: theme.colors.border.default }, ...cardStyles.formCard }}>
        <CardContent>
          <Flex direction="column" gap={2}>
            <Flex justify="space-between" align="center" gap={2}>
              <Text variant="small" weight="normal">
                {values.title?.trim() || __('Untitled coupon', 'kirki-ecommerce')}
              </Text>
              {hasDiscountAmount && (
                <Badge variant="destructive">
                  {/* TODO: Add currency formatter to show discount amount */}
                  {`${values.discount_amount}${isPercentage ? '%' : ''} ${__('OFF', 'kirki-ecommerce')}`}
                </Badge>
              )}
            </Flex>

            <Flex direction="column">
              {values.method === 'code' && (
                <Flex align="center" gap={1}>
                  <Text variant="heading4" weight="semibold" color={values.code ? 'emphasis' : 'disabled'}>
                    {values.code || __('No code set', 'kirki-ecommerce')}
                  </Text>
                  {
                    values.code && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={!values.code}
                        onClick={handleCopyCode}
                        aria-label={__('Copy coupon code', 'kirki-ecommerce')}
                      >
                        <Copy />
                      </Button>
                    )
                  }
                </Flex>
              )}

              <Flex align="center" gap={1}>
                <Text variant="small" color="primary">
                  {validUntil
                    ? __('Valid until', 'kirki-ecommerce')
                    : __('No expiration date', 'kirki-ecommerce')}
                </Text>
                <Text variant="small" color="primary" weight="semibold">
                  {validUntil}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </CardContent>
      </Card>

      <Card cssOverride={{ ...{ borderStyle: 'dashed', borderColor: theme.colors.border.default }, ...cardStyles.formCard }}>
        <CardContent>
          <Flex direction="column" gap={4}>
            <PreviewSection title={__('Type', 'kirki-ecommerce')} lines={typeLines} />
            <PreviewSection title={__('Details', 'kirki-ecommerce')} lines={detailsLines} />
            <PreviewSection title={__('Targeting', 'kirki-ecommerce')} lines={targetingLines} />
            <PreviewSection title={__('Conditions', 'kirki-ecommerce')} lines={conditionsLines} />
          </Flex>
        </CardContent>
      </Card>
    </Flex>
  );
};

CouponPreview.displayName = 'CouponPreview';

export default CouponPreview;

const styles = defineStyles({
  emptySection: {
    minHeight: theme.spacing[8],
  },
});
