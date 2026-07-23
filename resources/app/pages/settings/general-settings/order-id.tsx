import { useFormContext, useWatch } from 'react-hook-form';

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
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const OrderId = () => {
  const { setValue } = useFormContext<GeneralSettingsFormValues>();
  const orderIdPrefix = useWatch<GeneralSettingsFormValues>({
    name: 'order_id_prefix',
  });
  const orderIdSuffix = useWatch<GeneralSettingsFormValues>({
    name: 'order_id_suffix',
  });

  const orderID = `${orderIdPrefix || ''}${orderIdSuffix || ''}`;

  const handleResetIDField = () => {
    setValue('order_id_prefix', '', { shouldDirty: true });
    setValue('order_id_suffix', '', { shouldDirty: true });
  };

  return (
    <div>
      <Card type="large">
        <Text
          header={__('Order ID', 'kirki-ecommerce')}
          subHeader={__(
            'Shown on the order page, customer pages, and customer order notifications to identify order',
            'kirki-ecommerce',
          )}
          type="primary"
          css={styles.sectionHeader}
        />

        <Card type="inner" css={styles.innerCard}>
          <Flex direction="column" gap={16}>
            <Grid>
              <TextField
                name="order_id_prefix"
                label={__('Prefix', 'kirki-ecommerce')}
                placeholder={__('#ORD-', 'kirki-ecommerce')}
                description={__('Set order id prefix', 'kirki-ecommerce')}
              />

              <TextField
                name="order_id_suffix"
                label={__('Suffix', 'kirki-ecommerce')}
                placeholder={__('', 'kirki-ecommerce')}
                description={__('Set order id suffix', 'kirki-ecommerce')}
              />
            </Grid>

            <Card type="innerDark" css={styles.previewCard}>
              <Flex direction="column" gap={8}>
                <Label htmlFor="order-id-preview">
                  {__('Next order IDs will look like:', 'kirki-ecommerce')}
                </Label>
                <Input
                  id="order-id-preview"
                  value={orderID}
                  readOnly
                  css={styles.previewInput}
                />
              </Flex>
            </Card>

            <Card type="large" css={styles.resetCard}>
              <Flex direction="column" gap={10}>
                <Flex style={{ alignItems: 'center' }}>
                  <Text
                    type="secondary"
                    header={__('Reset Order ID', 'kirki-ecommerce')}
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
                    'Reset the order ID to your base ID for new fiscal years, system migration, or legal compliance.',
                    'kirki-ecommerce',
                  )}
                />
              </Flex>
            </Card>
          </Flex>
        </Card>
      </Card>
    </div>
  );
};

OrderId.displayName = 'OrderId';

export default OrderId;

const styles = {
  sectionHeader: scoped({
    gap: theme.spacing.base,
  }),
  innerCard: scoped({
    padding: theme.spacing['2xl'],
  }),
  previewCard: scoped({
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
