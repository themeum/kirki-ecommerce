import { useFormContext, useWatch } from 'react-hook-form';

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
import type { GeneralSettingsFormValues } from '@/schemas/forms/general-settings-form';
import { theme } from '@/theme';
import { mergeCss, defineStyles } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
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
      <Card cssOverride={cardStyles.largeCard}>
        <CardHeader cssOverride={cardStyles.sectionHeader}>
          <CardTitle>{__('Order ID', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Shown on the order page, customer pages, and customer order notifications to identify order',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent cssOverride={cardStyles.largeContent}>
          <Card cssOverride={cardStyles.innerCard}>
            <CardContent cssOverride={cardStyles.innerCardContent}>
              <Flex direction="column" gap={4}>
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

                <Card cssOverride={mergeCss(cardStyles.innerDarkCard, styles.previewCard)}>
                  <CardContent cssOverride={styles.previewCardContent}>
                    <Flex direction="column" gap={2}>
                      <Label htmlFor="order-id-preview">
                        {__('Next order IDs will look like:', 'kirki-ecommerce')}
                      </Label>
                      <Input
                        id="order-id-preview"
                        value={orderID}
                        readOnly
                        cssOverride={styles.previewInput}
                      />
                    </Flex>
                  </CardContent>
                </Card>

                <Card cssOverride={mergeCss(cardStyles.largeCard, styles.resetCard)}>
                  <CardContent cssOverride={cardStyles.largeContentPadded}>
                    <Flex direction="column" gap={3}>
                      <Flex align="center">
                        <Text weight="medium">{__('Reset Order ID', 'kirki-ecommerce')}</Text>
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
                          'Reset the order ID to your base ID for new fiscal years, system migration, or legal compliance.',
                          'kirki-ecommerce',
                        )}</Text>
                    </Flex>
                  </CardContent>
                </Card>
              </Flex>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

OrderId.displayName = 'OrderId';

export default OrderId;

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
