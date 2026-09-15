import { useFormContext, useWatch } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Label from '@/components/ui/label';
import type { GeneralSettingsFormInput } from '@/features/settings/general/schemas/forms/general-settings-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const OrderId = () => {
  const { control } = useFormContext<GeneralSettingsFormInput>();
  const orderIdPrefix = useWatch({
    control,
    name: 'order_number.prefix',
  });
  const orderIdSuffix = useWatch({
    control,
    name: 'order_number.suffix',
  });

  const orderID = [1, 2, 3]
    .map((id) => sprintf('%s00000%s%s', orderIdPrefix || '', id, orderIdSuffix || ''))
    .join(', ');

  return (
    <div>
      <Card
        data-search-id="general.order-id"
        data-search-keywords="order number, reference number, numbering"
        cssOverride={cardStyles.formCard}
      >
        <CardHeader>
          <CardTitle>{__('Order ID', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Prefix, suffix and numbering used for the order numbers customers see.',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Flex direction="column" gap={4}>
            <Grid>
              <TextField
                name="order_number.prefix"
                label={__('Prefix', 'kirki-ecommerce')}
                placeholder={__('#ORD-', 'kirki-ecommerce')}
                infoText={__('Set order id prefix', 'kirki-ecommerce')}
              />

              <TextField
                name="order_number.suffix"
                label={__('Suffix', 'kirki-ecommerce')}
                placeholder={__('f', 'kirki-ecommerce')}
                infoText={__('Set order id suffix', 'kirki-ecommerce')}
              />
            </Grid>

            <Card cssOverride={mergeCss(cardStyles.innerDarkCard)}>
              <CardContent cssOverride={styles.previewCardContent}>
                <Flex direction="column" gap={2}>
                  <Label htmlFor="order-id-preview">
                    {__('Next order IDs will look like:', 'kirki-ecommerce')}
                  </Label>
                  <div css={scoped(styles.previewCard)}>{orderID}</div>
                </Flex>
              </CardContent>
            </Card>

            {/* @todo: will implement later */}
            {/* <Card cssOverride={mergeCss(cardStyles.formCard, styles.resetCard)}>
                  <CardContent>
                    <Flex direction="column" gap={3}>
                      <Flex align="center">
                        <Text weight="medium">{__('Reset Order ID', 'kirki-ecommerce')}</Text>
                        <ActionGroup>
                          <Button variant="secondary" onClick={handleResetIDField}>
                            <ReplaceIcon />
                            {__('Reset Now', 'kirki-ecommerce')}
                          </Button>
                        </ActionGroup>
                      </Flex>
                      <Text color="secondary">
                        {__(
                          'Reset the order ID to your base ID for new fiscal years, system migration, or legal compliance.',
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

OrderId.displayName = 'OrderId';

export default OrderId;

const styles = defineStyles({
  previewCardContent: {
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
  },
  previewCard: {
    padding: theme.spacing[2],
    textAlign: 'center',
    borderRadius: theme.radius.sm,
    ...theme.typography.small(),
    color: theme.colors.text.special3,
    backgroundColor: theme.colors.background.surface,
  },
  resetCard: {
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.default}`,
  },
});
