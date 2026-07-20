import { useFormContext, useWatch } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import { ReplaceIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import Text from '@/molecules/text';
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
                <Input
                  label={__(
                    'Next invoice IDs will look like:',
                    'kirki-ecommerce',
                  )}
                  value={__(invoiceID, 'kirki-ecommerce')}
                  style={{
                    padding: 'var(--decom-spacing-2)',
                    textAlign: 'center',
                    color: 'var(--decom-text-text-special-3)',
                  }}
                />
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
                    text={__('Reset Now', 'kirki-ecommerce')}
                    size="small"
                    type="secondary"
                    leftIcon={<ReplaceIcon />}
                    onClick={handleResetIDField}
                  />
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
