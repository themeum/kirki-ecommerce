import { InfinityIcon } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldDescription } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import type { CouponFormInput } from '@/features/coupons/schemas/forms/coupon-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const ValidityPeriodSection = () => {
  const { control } = useFormContext<CouponFormInput>();
  const hasEndDatetime = useWatch({ control, name: 'has_end_datetime' });
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Validity Period', 'kirki-ecommerce')}</CardTitle>
        <Text variant="small" color="secondary">
          {__(
            'Define the duration for which your coupon will be valid.',
            'kirki-ecommerce',
          )}
        </Text>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={4}>
          <Grid>
            <TextField
              name="start_date"
              type="date"
              label={__('Start date', 'kirki-ecommerce')}
            />
            <TextField
              name="start_time"
              type="time"
              label={__('Start time', 'kirki-ecommerce')}
            />
          </Grid>

          <CheckboxField
            name="has_end_datetime"
            label={__('Set end date', 'kirki-ecommerce')}
          />

          {hasEndDatetime ? (
            <Grid>
              <TextField
                name="end_date"
                type="date"
                label={__('End date', 'kirki-ecommerce')}
              />
              <TextField
                name="end_time"
                type="time"
                label={__('End time', 'kirki-ecommerce')}
              />
            </Grid>
          ) : (
            <Flex align="center" gap={4} cssOverride={styles.infoBox}>
              <InfinityIcon size={16} stroke={theme.colors.icon.primary} />
              <FieldDescription cssOverride={styles.infoText}>
                {__(
                  'This coupon has no expiration date. To specify an end time, simply set an end date.',
                  'kirki-ecommerce',
                )}
              </FieldDescription>
            </Flex>
          )}
        </Flex>
      </CardContent>
    </Card>
  );
}

export default ValidityPeriodSection;

const styles = defineStyles({
  infoBox: {
    padding: theme.spacing[4],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.surfaceSecondary,
  },
  infoText: {
    margin: 0,
  },
});