import { useEffect, useRef } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import type { CouponFormInput } from '@/features/coupons/schemas/forms/coupon-form';
import { useGenerateNewCodeQuery, useValidateQuery } from '@/features/coupons/services/coupon';
import { useDebounce } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const CouponCodeField = () => {
  const { control, setValue, setError, clearErrors } = useFormContext<CouponFormInput>();

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
    <Flex direction="column" rowGap={1} cssOverride={{ margin: theme.spacing[1] }}>
      <Flex justify="space-between" align="center">
        <FieldLabel htmlFor="coupon-code">
          {__('Coupon Code', 'kirki-ecommerce')}
        </FieldLabel>
        <Button
          type="button"
          variant="link"
          size="xs"
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
                cssOverride={styles.codeInput}
                placeholder={__('e.g. ABC123', 'kirki-ecommerce')}
              />
              {isValidatingCode || isGeneratingCode && <Spinner cssOverride={styles.codeSpinner} />}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </Flex>
  );
};

CouponCodeField.displayName = 'CouponCodeField';

export default CouponCodeField;

const styles = defineStyles({
  codeInputWrapper: {
    position: 'relative',
    width: '100%',
  },
  codeInput: {
    paddingRight: theme.spacing[8],
  },
  codeSpinner: {
    position: 'absolute',
    top: '50%',
    right: theme.spacing[3],
    transform: 'translateY(-50%)',
  },
});
