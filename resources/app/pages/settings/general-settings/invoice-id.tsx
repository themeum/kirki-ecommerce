import { useFormContext, useWatch } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { ReplaceIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import type { GeneralSettingsFormValues } from '@/schemas/forms/general-settings-form';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
      <Card css={styles.largeCard}>
        <CardHeader css={styles.sectionHeader}>
          <CardTitle>{__('Invoice ID', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Customize your invoice ID structure and auto-numbering',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent css={styles.largeContent}>
          <Flex direction="column" gap={8}>
            <Card css={styles.innerCard}>
              <CardContent css={styles.innerCardContent}>
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

                  <Card css={[styles.innerDarkCard, styles.previewCard]}>
                    <CardContent css={styles.previewCardContent}>
                      <Flex direction="column" gap={8}>
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
                          css={styles.previewInput}
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
            <Card css={[styles.largeCard, styles.resetCard]}>
              <CardContent css={styles.largeContentPadded}>
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

const styles = {
  largeCard: scoped({
    gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({
    paddingInline: theme.spacing['3xl'],
  }),
  largeContentPadded: scoped({
    padding: theme.spacing['3xl'],
  }),
  sectionHeader: scoped({
    gap: theme.spacing.base,
    paddingInline: theme.spacing['3xl'],
  }),
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerCardContent: scoped({
    padding: theme.spacing['2xl'],
  }),
  innerDarkCard: scoped({
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing.none,
  }),
  previewCard: scoped({}),
  previewCardContent: scoped({
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  }),
  previewInput: scoped({
    padding: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.text.special3,
  }),
  resetCard: scoped({
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.default}`,
  }),
};
