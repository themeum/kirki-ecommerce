import { InfoIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Text from '@/components/ui/text';
import { resolveVatProcessChange } from '@/features/settings/tax/strategies/eu/lib/eu-region';
import type {
  TaxRegionEuFormInput,
  VatProcess,
} from '@/features/settings/tax/strategies/eu/schemas/forms/tax-region-eu-form';
import type { TaxSettings } from '@/schemas/catalog/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const VatProcessDescription = ({ description }: { description: ReactNode }) => {
  return (
    <Card
      data-search-skip="true"
      cssOverride={{ ...cardStyles.innerDarkCard, width: '100%' }}
      noShadow
    >
      <CardContent cssOverride={cardStyles.innerDarkContent}>
        <Text color="secondary" variant="small">
          {description}
        </Text>
      </CardContent>
    </Card>
  );
};

const VatProcessField = ({ taxSettings }: { taxSettings?: TaxSettings }) => {
  const { control, setValue, getValues } = useFormContext<TaxRegionEuFormInput>();
  const vatType = useWatch({ control, name: 'type' });

  const handleProcessChange = (value: string | number) => {
    const nextType = String(value) as VatProcess;
    setValue('type', nextType, { shouldDirty: true });

    const nextCountries = resolveVatProcessChange(nextType, getValues('countries') ?? []);
    if (nextCountries) {
      setValue('countries', nextCountries, { shouldDirty: true });
    }
  };

  return (
    <Flex direction="column" gap={2}>
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
                  <Card
                    data-search-skip="true"
                    cssOverride={mergeCss(cardStyles.innerCard, styles.vatProcessCard)}
                  >
                    <CardContent
                      cssOverride={mergeCss(cardStyles.innerContent, styles.vatProcessContent)}
                    >
                      <RadioGroupItem value="oss" id="vat-process-oss" />
                      <Text variant="small" weight="medium">
                        {__('One Stop Shop (OSS)', 'kirki-ecommerce')}
                      </Text>
                      {vatType === 'oss' && (
                        <VatProcessDescription
                          description={
                            <Text color="secondary" variant="small">
                              {__(
                                'Collect VAT based on the customer’s EU country for cross-border sales. VAT from all EU countries is reported through a single OSS return. Required once your EU cross-border sales exceed €10,000 per year.',
                                'kirki-ecommerce',
                              )}
                            </Text>
                          }
                        />
                      )}
                    </CardContent>
                  </Card>
                </FieldLabel>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="vat-process-micro-business"
                  cssOverride={styles.vatProcessLabel}
                >
                  <Card
                    data-search-skip="true"
                    cssOverride={mergeCss(cardStyles.innerCard, styles.vatProcessCard)}
                  >
                    <CardContent
                      cssOverride={mergeCss(cardStyles.innerContent, styles.vatProcessContent)}
                    >
                      <RadioGroupItem value="micro_business" id="vat-process-micro-business" />
                      <Text variant="small" weight="medium">
                        {__('Micro Business', 'kirki-ecommerce')}
                      </Text>
                      {vatType === 'micro_business' && (
                        <VatProcessDescription
                          description={
                            <Text color="secondary" variant="small">
                              {__(
                                'Collect VAT using your local country’s rate only. Applies when selling mainly within your own country. Available while EU cross-border sales remain below €10,000 per year.',
                                'kirki-ecommerce',
                              )}
                            </Text>
                          }
                        />
                      )}
                    </CardContent>
                  </Card>
                </FieldLabel>
              </Field>
            </RadioGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {isDefined(taxSettings) && taxSettings.is_tax_inclusive_price && (
        <VatProcessDescription
          description={
            <Flex gap={2} justify="space-between">
              <span css={scoped(styles.infoIcon)}>
                <InfoIcon size={18} />
              </span>
              <Text color="secondary" variant="small">
                {__(
                  'Under EU ancillary tax rules, shipping tax automatically matches the rates of items in the cart and splits proportionally for mixed orders (e.g., 19% and 7%). Ensure your shipping methods are marked as Taxable for this calculation to apply.',
                )}
              </Text>
            </Flex>
          }
        />
      )}
    </Flex>
  );
};

VatProcessField.displayName = 'VatProcessField';

export default VatProcessField;

const styles = defineStyles({
  processGroup: {
    marginTop: theme.spacing[4],
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
  infoIcon: {
    display: 'flex',
    flexShrink: 0,
    width: '20px',
  },
});
