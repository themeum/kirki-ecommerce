import { ReplaceIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import type { GeneralSettingsFormData } from './utils';

type InvoiceIdProps = {
  dataObj: GeneralSettingsFormData | null;
  handleOnChange: (value: unknown, key: string) => void;
  handleResetIDField: (key: string) => void;
  errors: FormErrors;
};

const InvoiceId = (props: InvoiceIdProps) => {
  const { dataObj, handleOnChange, handleResetIDField, errors } = props;

  const invoiceID = `${dataObj?.invoice_id_prefix || ''}${
    dataObj?.invoice_id_sequence || ''
  } ${dataObj?.invoice_id_suffix || ''}`;

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
                <Input
                  label={__('Prefix', 'kirki-ecommerce')}
                  value={dataObj?.invoice_id_prefix}
                  onChange={(value) =>
                    handleOnChange(value, 'invoice_id_prefix')
                  }
                  placeholder={__('INV-26-', 'kirki-ecommerce')}
                  helpText={__('Set invoice id prefix', 'kirki-ecommerce')}
                  error={
                    errors['data.invoice_id_prefix'] as
                      | string
                      | boolean
                      | undefined
                  }
                />

                <Input
                  label={__('Sequence', 'kirki-ecommerce')}
                  value={dataObj?.invoice_id_sequence}
                  onChange={(value) =>
                    handleOnChange(value, 'invoice_id_sequence')
                  }
                  placeholder={__('000001', 'kirki-ecommerce')}
                  helpText={__('Set invoice id sequence', 'kirki-ecommerce')}
                  error={
                    (
                      errors as FormErrors & {
                        data?: { invoice_id_sequence?: string };
                      }
                    )?.data?.invoice_id_sequence as string | boolean | undefined
                  }
                />
                <Input
                  label={__('Suffix', 'kirki-ecommerce')}
                  value={dataObj?.invoice_id_suffix}
                  onChange={(value) =>
                    handleOnChange(value, 'invoice_id_suffix')
                  }
                  placeholder={__('KIRKI', 'kirki-ecommerce')}
                  helpText={__('Set invoice id suffix', 'kirki-ecommerce')}
                  error={
                    errors['data.invoice_id_suffix'] as
                      | string
                      | boolean
                      | undefined
                  }
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
                  error={
                    errors['data.invoiceID'] as string | boolean | undefined
                  }
                />
              </Card>

              <Select
                label={__('Invoice Counter Reset Schedule', 'kirki-ecommerce')}
                onChange={(value) =>
                  handleOnChange(value, 'invoice_counter_reset_schedule')
                }
                optionsArray={[
                  {
                    title: __('No Schedule', 'kirki-ecommerce'),
                    value: 'none',
                  },
                ]}
                defaultValue="none"
                error={
                  errors['data.invoice_counter_reset_schedule'] as
                    | string
                    | boolean
                    | undefined
                }
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
                    onClick={() => handleResetIDField('invoice')}
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

export default InvoiceId;
