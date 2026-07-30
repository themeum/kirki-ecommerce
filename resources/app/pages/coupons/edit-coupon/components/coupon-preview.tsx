import { format } from 'date-fns';
import { Copy } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { DATE_FORMATS, END_OF_DAY_TIME, START_OF_DAY_TIME } from '@/libs/date';
import type { CouponFormValues } from '@/schemas/forms/coupon-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { mergeDateTime } from '../config/coupon-datetime';

const formatDisplayDate = (date?: string, time?: string): string | null => {
  const merged = mergeDateTime(date ?? '', time ?? '');

  if (!merged) {
    return null;
  }

  return format(merged, DATE_FORMATS.HUMAN_READABLE_WITH_TIME);
};

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
        {lines.map((line) => (
          <Text key={line} variant="small">
            {`• ${line}`}
          </Text>
        ))}
      </Flex>
    ) : (
      <Text variant='tiny' weight='normal' cssOverride={styles.emptySection}>{__('Not set yet', 'kirki-ecommerce')}</Text>
    )}
  </Flex>
);

PreviewSection.displayName = 'PreviewSection';

const CouponPreview = () => {
  const { control } = useFormContext<CouponFormValues>();
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
    values.start_date,
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

  // const conditionsLines = [
  //   values.has_usage_limit && values.usage_limit
  //     ? `${__('Limited to', 'kirki-ecommerce')} ${values.usage_limit} ${__('uses', 'kirki-ecommerce')}`
  //     : __('No usage limits', 'kirki-ecommerce'),
  //   __("Can't combine with other discounts", 'kirki-ecommerce'),
  // ];

  return (
    <Flex direction="column">
      <Card cssOverride={{ ...{ borderStyle: 'dashed', borderColor: theme.colors.border.default }, ...cardStyles.formCard }}>
        <CardContent>
          <Flex direction="column" gap={2}>
            <Flex justify="space-between" align="center" gap={2}>
              <Text variant="small" weight='normal'>
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
                  <Text variant="heading4" weight='semibold' color={values.code ? "emphasis" : "caution"}>
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

              <Text variant="small" color="secondary">
                {validUntil
                  ? `${__('Valid until', 'kirki-ecommerce')} ${validUntil}`
                  : __('No expiration date', 'kirki-ecommerce')}
              </Text>
            </Flex>
          </Flex>
        </CardContent>
      </Card>

      <Card cssOverride={{ ...{ borderStyle: 'dashed', borderColor: theme.colors.border.default }, ...cardStyles.formCard }}>
        <CardContent>
          <Flex direction="column" gap={4}>
            <PreviewSection title={__('Type', 'kirki-ecommerce')} lines={typeLines} />
            <PreviewSection title={__('Details', 'kirki-ecommerce')} lines={detailsLines} />
            {/* TODO: Add these sections later */}
            {/* <PreviewSection title={__('Targeting', 'kirki-ecommerce')} /> */}
            {/* <PreviewSection title={__('Conditions', 'kirki-ecommerce')} lines={conditionsLines} /> */}
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
