import { useFormContext, useWatch } from 'react-hook-form';

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
      <Card css={styles.largeCard}>
        <CardHeader css={styles.sectionHeader}>
          <CardTitle>{__('Order ID', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Shown on the order page, customer pages, and customer order notifications to identify order',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent css={styles.largeContent}>
          <Card css={styles.innerCard}>
            <CardContent css={styles.innerCardContent}>
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

                <Card css={[styles.innerDarkCard, styles.previewCard]}>
                  <CardContent css={styles.previewCardContent}>
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
                  </CardContent>
                </Card>

                <Card css={[styles.largeCard, styles.resetCard]}>
                  <CardContent css={styles.largeContentPadded}>
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
