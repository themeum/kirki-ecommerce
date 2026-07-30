import { useEffect, useRef } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import { useDebounce } from '@/hooks';
import type { CouponFormValues } from '@/schemas/forms/coupon-form';
import { useGenerateNewCodeQuery, useValidateQuery } from '@/services/coupon';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import DiscountTypeSelector from '@/pages/coupons/edit-coupon/components/contents/discount-type-selector';
import DiscountValueSection from '@/pages/coupons/edit-coupon/components/contents/discount-value-section';
import { css } from '@emotion/react';
import { InfinityIcon } from 'lucide-react';


const DetailsTab = () => {
  const { control, setValue, setError, clearErrors } = useFormContext<CouponFormValues>();
  const method = useWatch({ control, name: 'method' });
  const discountType = useWatch({ control, name: 'discount_type' });
  const hasEndDatetime = useWatch({ control, name: 'has_end_datetime' });
  const isAmountOff = discountType === 'amount-off';

  const isManualCodeEditRef = useRef(false);
  const code = useWatch({ control, name: 'code' });
  const debouncedCode = useDebounce(code?.trim() ?? '', 400);
  const codeToValidate = isManualCodeEditRef.current ? debouncedCode : '';

  const { refetch: fetchNewCode, isFetching: isGeneratingCode } = useGenerateNewCodeQuery();
  const { data: validation, isFetching: isValidatingCode } = useValidateQuery(
    codeToValidate,
    Boolean(codeToValidate),
  );

  useEffect(() => {
    if (!codeToValidate || !validation) {
      return;
    }

    if (validation.data) {
      clearErrors('code');
    } else {
      setError('code', { type: 'manual', message: validation.message });
    }
  }, [validation, codeToValidate, clearErrors, setError]);

  const handleGenerateCode = async () => {
    isManualCodeEditRef.current = false;
    const { data } = await fetchNewCode();
    if (data?.data) {
      setValue('code', data.data, { shouldDirty: true, shouldValidate: true });
      clearErrors('code');
    }
  };

  return (
    <Flex direction="column" gap={4}>
      <Card css={cardStyles.formCard}>
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
              css={styles.methodField}
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
              {method === 'code' && (
                <Flex direction="column" rowGap={1} css={css({ margin: theme.spacing[1] })}>
                  <Flex justify="space-between" align="center">
                    <FieldLabel htmlFor="coupon-code">
                      {__('Coupon Code', 'kirki-ecommerce')}
                    </FieldLabel>
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      // loading={isGeneratingCode}
                      disabled={isGeneratingCode}
                      onClick={handleGenerateCode}
                    >
                      <Text variant="tiny" color="emphasis">{__('Generate Code', 'kirki-ecommerce')}</Text>
                    </Button>
                  </Flex>
                  <Controller
                    control={control}
                    name="code"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <div css={styles.codeInputWrapper}>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            onChange={(event) => {
                              isManualCodeEditRef.current = true;
                              field.onChange(event);
                            }}
                            error={Boolean(fieldState.error)}
                            aria-invalid={fieldState.invalid}
                            css={styles.codeInput}
                          />
                          {isValidatingCode || isGeneratingCode && <Spinner css={styles.codeSpinner} />}
                        </div>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </Flex>
              )}
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

      <Card css={cardStyles.formCard}>
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
              <Flex align="center" gap={2} css={styles.infoBox}>
                <InfinityIcon size={16} stroke={theme.colors.icon.primary} />
                <FieldDescription css={styles.infoText}>
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
    </Flex>
  );
};

DetailsTab.displayName = 'DetailsTab';

export default DetailsTab;

const styles = {
  methodField: scoped({
    gap: theme.spacing[2],
  }),
  infoBox: scoped({
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.surfaceSecondary,
  }),
  infoText: scoped({
    margin: 0,
  }),
  codeLabel: { display: 'flex', justifyContent: 'space-between', width: '100%' },
  codeInputWrapper: scoped({
    position: 'relative',
    width: '100%',
  }),
  codeInput: scoped({
    paddingRight: theme.spacing[8],
  }),
  codeSpinner: scoped({
    position: 'absolute',
    top: '50%',
    right: theme.spacing[3],
    transform: 'translateY(-50%)',
  }),
};
