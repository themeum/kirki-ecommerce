import { useFormContext, useWatch } from 'react-hook-form';

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
          style={{ gap: 'var(--decom-spacing-f3)' }}
        />

        <Card type="inner" style={{ padding: 'var(--decom-spacing-4)' }}>
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

            <Card
              type="innerDark"
              style={{
                padding: 'var(--decom-spacing-2) var(--decom-spacing-3)',
              }}
            >
              <Input
                label={__('Next order IDs will look like:', 'kirki-ecommerce')}
                value={orderID}
                style={{
                  padding: 'var(--decom-spacing-2)',
                  textAlign: 'center',
                  color: 'var(--decom-text-text-special-3)',
                }}
              />
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
                    header={__('Reset Order ID', 'kirki-ecommerce')}
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
