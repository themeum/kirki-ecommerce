import { useFormContext, useWatch } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { ReplaceIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import type { GeneralSettingsFormInput } from '@/schemas/forms/general-settings-form';
import { theme } from '@/theme';
import { mergeCss, defineStyles } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const invoiceResetScheduleOptions = [
  {
    label: __('No Schedule', 'kirki-ecommerce'),
    value: 'none',
  },
];

const InvoiceId = () => {
  const { setValue } = useFormContext<GeneralSettingsFormInput>();
  const invoiceIdPrefix = useWatch<GeneralSettingsFormInput>({
    name: 'invoice_id_prefix',
  });
  const invoiceIdSequence = useWatch<GeneralSettingsFormInput>({
    name: 'invoice_id_sequence',
  });
  const invoiceIdSuffix = useWatch<GeneralSettingsFormInput>({
    name: 'invoice_id_suffix',
  });

  const invoiceID = `${invoiceIdPrefix || ''}${invoiceIdSequence || ''} ${
    invoiceIdSuffix || ''
  }`;

  const handleResetIDField = () => {
    setValue('invoice_id_prefix', '', { shouldDirty: true });
    setValue('invoice_id_sequence', '', { shouldDirty: true });
    setValue('invoice_id_suffix', '', { shouldDirty: true });
  };

  return (
    <div>
      <Card cssOverride={cardStyles.largeCard}>
        <CardHeader cssOverride={cardStyles.sectionHeader}>
          <CardTitle>{__('Invoice ID', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Customize your invoice ID structure and auto-numbering',
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
                      name="invoice_id_prefix"
                      label={__('Prefix', 'kirki-ecommerce')}
                      placeholder={__('INV-26-', 'kirki-ecommerce')}
                      description={__('Set invoice id prefix', 'kirki-ecommerce')}
                    />

                    <TextField
                      name="invoice_id_sequence"
                      label={__('Sequence', 'kirki-ecommerce')}
                      placeholder={__('000001', 'kirki-ecommerce')}
                      description={__(
                        'Set invoice id sequence',
                        'kirki-ecommerce',
                      )}
                    />

                    <TextField
                      name="invoice_id_suffix"
                      label={__('Suffix', 'kirki-ecommerce')}
                      placeholder={__('KIRKI', 'kirki-ecommerce')}
                      description={__('Set invoice id suffix', 'kirki-ecommerce')}
                    />
                  </Grid>

                  <Card cssOverride={mergeCss(cardStyles.innerDarkCard, styles.previewCard)}>
                    <CardContent cssOverride={styles.previewCardContent}>
                      <Flex direction="column" gap={2}>
                        <Label htmlFor="invoice-id-preview">
                          {__(
                            'Next invoice IDs will look like:',
                            'kirki-ecommerce',
                          )}
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

                  <SelectField
                    name="invoice_counter_reset_schedule"
                    label={__(
                      'Invoice Counter Reset Schedule',
                      'kirki-ecommerce',
                    )}
                    options={invoiceResetScheduleOptions}
                  />
                </Flex>
              </CardContent>
            </Card>
            <Card cssOverride={mergeCss(cardStyles.largeCard, styles.resetCard)}>
              <CardContent cssOverride={cardStyles.largeContentPadded}>
                <Flex direction="column" gap={3}>
                  <Flex align="center">
                    <Text weight="medium">{__('Reset Invoice ID', 'kirki-ecommerce')}</Text>
                    <ActionGroup>
                      <Button
                        variant="secondary"
                        onClick={handleResetIDField}
                      >
                        <ReplaceIcon />
                        {__('Reset Now', 'kirki-ecommerce')}
                      </Button>
                    </ActionGroup>
                  </Flex>
                  <Text color="secondary">{__(
                      'Reset the Invoice ID to your base ID for new fiscal years, system migration, or legal compliance.',
                      'kirki-ecommerce',
                    )}</Text>
                </Flex>
              </CardContent>
            </Card>
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
  }
});
