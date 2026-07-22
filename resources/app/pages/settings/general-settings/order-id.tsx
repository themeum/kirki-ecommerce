import { useFormContext, useWatch } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { CLASS_PREFIX } from '@/conf';
import { ReplaceIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
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
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
        <Text
          header={__('Order ID', 'kirki-ecommerce')}
          subHeader={__(
            'Shown on the order page, customer pages, and customer order notifications to identify order',
            'kirki-ecommerce',
          )}
          type="primary"
          style={{ gap: 'var(--decom-spacing-f3)' }}
        />

        <Card
          className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner`}
          style={{ padding: 'var(--decom-spacing-4)' }}
        >
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
              className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-innerDark`}
              style={{
                padding: 'var(--decom-spacing-2) var(--decom-spacing-3)',
              }}
            >
              <Flex direction="column" gap={8}>
                <Label htmlFor="order-id-preview">
                  {__('Next order IDs will look like:', 'kirki-ecommerce')}
                </Label>
                <Input
                  id="order-id-preview"
                  value={orderID}
                  readOnly
                  style={{
                    padding: 'var(--decom-spacing-2)',
                    textAlign: 'center',
                    color: 'var(--decom-text-text-special-3)',
                  }}
                />
              </Flex>
            </Card>

            <Card
              className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}
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
