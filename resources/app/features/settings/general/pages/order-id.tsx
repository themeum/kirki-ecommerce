import { useFormContext, useWatch } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import type { GeneralSettingsFormInput } from '@/features/settings/general/schemas/forms/general-settings-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
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

  const orderID = sprintf('%s000001%s', orderIdPrefix || '', orderIdSuffix || '');

  return (
    <div>
      <Card data-search-id="general.order-id" cssOverride={cardStyles.formCard}>
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
                    name="order_number.prefix"
                    label={__('Prefix', 'kirki-ecommerce')}
                    placeholder={__('Enter a prefix', 'kirki-ecommerce')}
                    description={__('Set order id prefix', 'kirki-ecommerce')}
                  />

                  <TextField
                    name="order_number.suffix"
                    label={__('Suffix', 'kirki-ecommerce')}
                    placeholder={__('Enter a suffix', 'kirki-ecommerce')}
                    description={__('Set order id suffix', 'kirki-ecommerce')}
                  />
                </Grid>

                <Card cssOverride={mergeCss(cardStyles.innerDarkCard, styles.previewCard)}>
                  <CardContent cssOverride={styles.previewCardContent}>
                    <Flex direction="column" gap={2}>
                      <Label htmlFor="order-id-preview">
                        {__('Order IDs will look like:', 'kirki-ecommerce')}
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
  },
});
