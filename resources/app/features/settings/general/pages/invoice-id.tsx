import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Label from '@/components/ui/label';
import type { GeneralSettingsFormInput } from '@/features/settings/general/schemas/forms/general-settings-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { incrementString } from '@/utils/string';
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

  const invoiceID = [1, 2, 3]
    .map((id) =>
      sprintf(
        '%s%s%s%s',
        invoiceIdPrefix || 'XXX-',
        applyYearPrefix ? '26-' : '',
        incrementString(invoiceIdSequence, id) || '00001',
        invoiceIdSuffix || '',
      ),
    )
    .join(', ');

  return (
    <div>
      <Card
        data-search-id="general.invoice-id"
        data-search-keywords="receipt number, bill number, numbering, fiscal year"
        cssOverride={cardStyles.formCard}
      >
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
            <Flex direction="column" gap={4}>
              <Grid columns={3}>
                <TextField
                  name="invoice_number.prefix"
                  label={__('Prefix', 'kirki-ecommerce')}
                  placeholder={__('INV-20', 'kirki-ecommerce')}
                  infoText={__('Set invoice id prefix', 'kirki-ecommerce')}
                />

                <TextField
                  name="invoice_number.sequence"
                  label={__('Sequence', 'kirki-ecommerce')}
                  placeholder={__('000001', 'kirki-ecommerce')}
                  infoText={__('Set invoice id sequence', 'kirki-ecommerce')}
                />

                <TextField
                  name="invoice_number.suffix"
                  label={__('Suffix', 'kirki-ecommerce')}
                  placeholder={__('KIRKI', 'kirki-ecommerce')}
                  infoText={__('Set invoice id suffix', 'kirki-ecommerce')}
                />
              </Grid>

              <CheckboxField
                name="invoice_number.apply_year_prefix"
                label={__('Apply year prefix', 'kirki-ecommerce')}
              />

              <Card cssOverride={mergeCss(cardStyles.innerDarkCard)}>
                <CardContent cssOverride={styles.previewCardContent}>
                  <Flex direction="column" gap={2}>
                    <Label htmlFor="invoice-id-preview">
                      {__('Next invoice IDs will look like:', 'kirki-ecommerce')}
                    </Label>
                    <div css={scoped(styles.previewCard)}>{invoiceID}</div>
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
  previewCard: {
    padding: theme.spacing[2],
    textAlign: 'center',
    borderRadius: theme.radius.sm,
    ...theme.typography.small(),
    color: theme.colors.text.special3,
    backgroundColor: theme.colors.background.surface,
  },
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
