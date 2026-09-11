import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import type { GeneralSettingsFormInput } from '@/features/settings/general/schemas/forms/general-settings-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const InvoiceId = () => {
  const { control } = useFormContext<GeneralSettingsFormInput>();
  const invoiceIdPrefix = useWatch({
    control,
    name: 'invoice_number.prefix',
  });
  const invoiceIdSequence = useWatch({
    control,
    name: 'invoice_number.sequence',
  });
  const invoiceIdSuffix = useWatch({
    control,
    name: 'invoice_number.suffix',
  });

  const applyYearPrefix = useWatch({
    control,
    name: 'invoice_number.apply_year_prefix',
  });

  const invoiceID = sprintf(
    '%s%s%s%s',
    invoiceIdPrefix || '',
    applyYearPrefix ? '26-' : '',
    invoiceIdSequence || '000001',
    invoiceIdSuffix || '',
  );

  return (
    <div>
      <Card data-search-id="general.invoice-id" data-search-keywords="receipt number, bill number, numbering, fiscal year" cssOverride={cardStyles.formCard}>
        <CardHeader cssOverride={cardStyles.sectionHeader}>
          <CardTitle>{__('Invoice ID', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Prefix, suffix, sequence and yearly reset for invoice numbering.',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent cssOverride={cardStyles.largeContent}>
          <Flex direction="column" gap={2}>
            <Card cssOverride={cardStyles.innerCard}>
              <CardContent cssOverride={cardStyles.innerCardContent}>
                <Flex direction="column" gap={4}>
                  <Grid columns={3}>
                    <TextField
                      name="invoice_number.prefix"
                      label={__('Prefix', 'kirki-ecommerce')}
                      placeholder={__('Enter a prefix', 'kirki-ecommerce')}
                      description={__('Set invoice id prefix', 'kirki-ecommerce')}
                    />

                    <TextField
                      name="invoice_number.sequence"
                      label={__('Sequence', 'kirki-ecommerce')}
                      placeholder={__('000001', 'kirki-ecommerce')}
                      description={__('Set invoice id sequence', 'kirki-ecommerce')}
                    />

                    <TextField
                      name="invoice_number.suffix"
                      label={__('Suffix', 'kirki-ecommerce')}
                      placeholder={__('Enter a suffix', 'kirki-ecommerce')}
                      description={__('Set invoice id suffix', 'kirki-ecommerce')}
                    />
                  </Grid>

                  <CheckboxField
                    name="invoice_number.apply_year_prefix"
                    label={__('Apply year prefix', 'kirki-ecommerce')}
                  />

                  <Card cssOverride={mergeCss(cardStyles.innerDarkCard, styles.previewCard)}>
                    <CardContent cssOverride={styles.previewCardContent}>
                      <Flex direction="column" gap={2}>
                        <Label htmlFor="invoice-id-preview">
                          {__('Invoice IDs will look like:', 'kirki-ecommerce')}
                        </Label>
                        <Input
                          id="invoice-id-preview"
                          value={__(invoiceID, 'kirki-ecommerce')}
                          readOnly
                          cssOverride={styles.previewInput}
                        />
                      </Flex>
                    </CardContent>
                  </Card>

                  {applyYearPrefix && (
                    <CheckboxField
                      name="invoice_number.reset_sequence_every_year"
                      label={__(
                        'Apply invoice sequence reset every year (January 1)',
                        'kirki-ecommerce',
                      )}
                    />
                  )}
                </Flex>
              </CardContent>
            </Card>
            {/* @todo: will implement later */}
            {/* <Card cssOverride={mergeCss(cardStyles.formCard, styles.resetCard)}>
              <CardContent>
                <Flex direction="column" gap={3}>
                  <Flex align="center">
                    <Text weight="medium">{__('Reset Invoice ID', 'kirki-ecommerce')}</Text>
                    <ActionGroup>
                      <Button variant="secondary" onClick={handleResetIDField}>
                        <ReplaceIcon />
                        {__('Reset Now', 'kirki-ecommerce')}
                      </Button>
                    </ActionGroup>
                  </Flex>
                  <Text color="secondary">
                    {__(
                      'Reset the Invoice ID to your base ID for new fiscal years, system migration, or legal compliance.',
                      'kirki-ecommerce',
                    )}
                  </Text>
                </Flex>
              </CardContent>
            </Card> */}
          </Flex>
        </CardContent>
      </Card>
    </div>
  );
};

InvoiceId.displayName = 'InvoiceId';

export default InvoiceId;

const styles = defineStyles({
  previewCard: {},
  previewCardContent: {
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
  },
  previewInput: {
    padding: theme.spacing[2],
    textAlign: 'center',
    color: theme.colors.text.special3,
  },
  resetCard: {
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.default}`,
  },
});
