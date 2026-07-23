import { useFormContext, useWatch } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { ReplaceIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import type { GeneralSettingsFormValues } from '@/schemas/forms/general-settings-form';
import { __ } from '@/wpi18n';

const invoiceResetScheduleOptions = [
  {
    label: __('No Schedule', 'kirki-ecommerce'),
    value: 'none',
  },
];

const InvoiceId = () => {
  const { setValue } = useFormContext<GeneralSettingsFormValues>();
  const invoiceIdPrefix = useWatch<GeneralSettingsFormValues>({
    name: 'invoice_id_prefix',
  });
  const invoiceIdSequence = useWatch<GeneralSettingsFormValues>({
    name: 'invoice_id_sequence',
  });
  const invoiceIdSuffix = useWatch<GeneralSettingsFormValues>({
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
      <Card type="large">
        <Text
          header={__('Invoice ID', 'kirki-ecommerce')}
          subHeader={__(
            'Customize your invoice ID structure and auto-numbering',
            'kirki-ecommerce',
          )}
          type="primary"
          style={{ gap: 'var(--decom-spacing-f3)' }}
        />
        <Flex direction="column" gap={8}>
          <Card type="inner" style={{ padding: 'var(--decom-spacing-4)' }}>
            <Flex direction="column" gap={16}>
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
                  description={__('Set invoice id sequence', 'kirki-ecommerce')}
                />

                <TextField
                  name="invoice_id_suffix"
                  label={__('Suffix', 'kirki-ecommerce')}
                  placeholder={__('KIRKI', 'kirki-ecommerce')}
                  description={__('Set invoice id suffix', 'kirki-ecommerce')}
                />
              </Grid>

              <Card
                type="innerDark"
                style={{
                  padding: 'var(--decom-spacing-2) var(--decom-spacing-3)',
                }}
              >
                <Flex direction="column" gap={8}>
                  <Label htmlFor="invoice-id-preview">
                    {__('Next invoice IDs will look like:', 'kirki-ecommerce')}
                  </Label>
                  <Input
                    id="invoice-id-preview"
                    value={__(invoiceID, 'kirki-ecommerce')}
                    readOnly
                    style={{
                      padding: 'var(--decom-spacing-2)',
                      textAlign: 'center',
                      color: 'var(--decom-text-text-special-3)',
                    }}
                  />
                </Flex>
              </Card>

              <SelectField
                name="invoice_counter_reset_schedule"
                label={__('Invoice Counter Reset Schedule', 'kirki-ecommerce')}
                options={invoiceResetScheduleOptions}
              />
            </Flex>
          </Card>
          <Card
            type="large"
            style={{
              borderRadius: 'var(--decom-radius-rounded-lg)',
              border: '1px solid var(--decom-border-border)',
            }}
          >
            <Flex direction="column" gap={10}>
              <Flex style={{ alignItems: 'center' }}>
                <Text
                  type="secondary"
                  header={__('Reset Invoice ID', 'kirki-ecommerce')}
                />
                <ActionGroup>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResetIDField}
                  >
                    <ReplaceIcon />
                    {__('Reset Now', 'kirki-ecommerce')}
                  </Button>
                </ActionGroup>
              </Flex>
              <Text
                type="primary"
                subHeader={__(
                  'Reset the Invoice ID to your base ID for new fiscal years, system migration, or legal compliance.',
                  'kirki-ecommerce',
                )}
              />
            </Flex>
          </Card>
        </Flex>
      </Card>
    </div>
  );
};

InvoiceId.displayName = 'InvoiceId';

export default InvoiceId;
