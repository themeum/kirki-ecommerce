import { useFormContext, useWatch } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Text from '@/components/ui/text';
import { resolveVatProcessChange } from '@/features/settings/tax/strategies/eu/lib/eu-region';
import type {
  TaxRegionEuFormInput,
  VatProcess,
} from '@/features/settings/tax/strategies/eu/schemas/forms/tax-region-eu-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const VatProcessDescription = ({ processValue }: { processValue: string }) => {
  const currentProcess = useWatch<TaxRegionEuFormInput>({ name: 'type' });

  if (currentProcess !== processValue) {
    return null;
  }

  return (
    <Card cssOverride={{ ...cardStyles.innerDarkCard, width: '100%' }}>
      <CardContent cssOverride={cardStyles.innerDarkContent}>
        <Text color="secondary" variant="small">
          {processValue === 'oss'
            ? __(
                'Collect VAT based on the customer’s EU country for cross-border sales. VAT from all EU countries is reported through a single OSS return. Required once your EU cross-border sales exceed €10,000 per year.',
                'kirki-ecommerce',
              )
            : __(
                'Collect VAT using your local country’s rate only. Applies when selling mainly within your own country. Available while EU cross-border sales remain below €10,000 per year.',
                'kirki-ecommerce',
              )}
        </Text>
      </CardContent>
    </Card>
  );
};

const VatProcessField = () => {
  const { control, setValue, getValues } = useFormContext<TaxRegionEuFormInput>();

  const handleProcessChange = (value: string | number) => {
    const nextType = String(value) as VatProcess;
    setValue('type', nextType, { shouldDirty: true });

    const nextCountries = resolveVatProcessChange(nextType, getValues('countries') ?? []);
    if (nextCountries) {
      setValue('countries', nextCountries, { shouldDirty: true });
    }
  };

  return (
    <Controller
      control={control}
      name="type"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <RadioGroup
            value={field.value}
            onValueChange={(value) => handleProcessChange(value)}
            aria-invalid={fieldState.invalid}
            cssOverride={styles.processGroup}
          >
            <Field>
              <FieldLabel htmlFor="vat-process-oss" cssOverride={styles.vatProcessLabel}>
                <Card cssOverride={mergeCss(cardStyles.innerCard, styles.vatProcessCard)}>
                  <CardContent cssOverride={mergeCss(cardStyles.innerContent, styles.vatProcessContent)}>
                    <RadioGroupItem value="oss" id="vat-process-oss" />
                    <Text variant="small" weight="medium">
                      {__('One Stop Shop (OSS)', 'kirki-ecommerce')}
                    </Text>
                    <VatProcessDescription processValue="oss" />
                  </CardContent>
                </Card>
              </FieldLabel>
            </Field>

            <Field>
              <FieldLabel
                htmlFor="vat-process-micro-business"
                cssOverride={styles.vatProcessLabel}
              >
                <Card cssOverride={mergeCss(cardStyles.innerCard, styles.vatProcessCard)}>
                  <CardContent cssOverride={mergeCss(cardStyles.innerContent, styles.vatProcessContent)}>
                    <RadioGroupItem value="micro_business" id="vat-process-micro-business" />
                    <Text variant="small" weight="medium">
                      {__('Micro Business', 'kirki-ecommerce')}
                    </Text>
                    <VatProcessDescription processValue="micro_business" />
                  </CardContent>
                </Card>
              </FieldLabel>
            </Field>
          </RadioGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

VatProcessField.displayName = 'VatProcessField';

export default VatProcessField;

const styles = defineStyles({
  processGroup: {
    marginTop: theme.spacing[5],
  },
  vatProcessCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
  },
  vatProcessLabel: {
    width: '100%',
    cursor: 'pointer',
    '&:has([data-state="checked"])': {
      backgroundColor: 'transparent',
    },
  },
  vatProcessContent: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
});
