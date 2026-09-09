import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import NumberField from '@/components/form/number-field';
import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import type { VariantFormInput } from '@/features/inventory/schemas/forms/variant-form';
import { generateSku } from '@/features/products/lib/utils';
import { WandIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type InventoryProps = {
  committedQuantity?: number | null;
};

const Inventory = ({ committedQuantity }: InventoryProps) => {
  const { control, setValue } = useFormContext<VariantFormInput>();
  const trackInventory = Boolean(useWatch({ control, name: 'track_inventory' }));
  const hasLimitPerOrder = Boolean(useWatch({ control, name: 'has_limit_per_order' }));

  const handleTrackInventoryChange = (checked: boolean) => {
    if (!checked) {
      setValue('available_quantity', 0, { shouldDirty: true });
    }
  };

  const handleGenerateSku = () => {
    setValue('sku', generateSku(), { shouldDirty: true, shouldTouch: true });
  };

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Inventory', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent cssOverride={styles.cardContent}>
        <CheckboxField
          name="track_inventory"
          label={__('Track quantity', 'kirki-ecommerce')}
          onCheckedChange={handleTrackInventoryChange}
        />

        {trackInventory ? (
          <Card cssOverride={cardStyles.innerCard}>
            <CardContent cssOverride={cardStyles.innerContent}>
              <Grid columns={3}>
                <NumberField
                  name="available_quantity"
                  label={__('Available', 'kirki-ecommerce')}
                  placeholder={__('600', 'kirki-ecommerce')}
                />
                <Field>
                  <FieldLabel htmlFor="committed_quantity">
                    {__('Committed', 'kirki-ecommerce')}
                  </FieldLabel>
                  <Input
                    id="committed_quantity"
                    type="number"
                    value={committedQuantity ?? 0}
                    readOnly
                    disabled
                  />
                </Field>
                <NumberField
                  name="low_stock_threshold"
                  label={__('Low stock threshold', 'kirki-ecommerce')}
                  infoText={__(
                    'Notify when stock falls below this amount.',
                    'kirki-ecommerce',
                  )}
                  placeholder={__('600', 'kirki-ecommerce')}
                />
              </Grid>
            </CardContent>
          </Card>
        ) : (
          <SelectField
            name="in_stock"
            label={__('Status', 'kirki-ecommerce')}
            placeholder={__('In Stock', 'kirki-ecommerce')}
            options={[
              { value: 'true', label: __('In Stock', 'kirki-ecommerce') },
              { value: 'false', label: __('Out of Stock', 'kirki-ecommerce') },
            ]}
          />
        )}

        <Flex direction="column" gap={1}>
          <Flex justify="space-between" align="center">
            <FieldLabel
              htmlFor="sku"
              infoText={__('SKU (Stock Keeping Unit)', 'kirki-ecommerce')}
            >
              {__('SKU', 'kirki-ecommerce')}
            </FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleGenerateSku}
              aria-label={__('Generate SKU', 'kirki-ecommerce')}
            >
              <WandIcon />
            </Button>
          </Flex>
          <TextField
            name="sku"
            placeholder={__('SKU-XYZ-1234', 'kirki-ecommerce')}
          />
        </Flex>

        <Grid gap={2} template="1fr 2fr">
          <Card cssOverride={cardStyles.innerDarkCard}>
            <CardContent cssOverride={styles.innerDarkRowContent}>
              <CheckboxField
                name="allow_back_order"
                label={__('Sell when out of stock', 'kirki-ecommerce')}
              />
            </CardContent>
          </Card>

          <Card cssOverride={cardStyles.innerDarkCard}>
            <CardContent cssOverride={styles.innerDarkRowContent}>
              <Flex align="center" justify="space-between" gap={2}>
                <CheckboxField
                  name="has_limit_per_order"
                  label={__('Limit orders to number of item', 'kirki-ecommerce')}
                  infoText={__(
                    'Limit the number of items a customer can purchase in a single order.',
                    'kirki-ecommerce',
                  )}
                />
                {hasLimitPerOrder && (
                  <NumberField
                    name="max_per_order"
                    cssOverride={styles.maxPerOrderField}
                  />
                )}
              </Flex>
            </CardContent>
          </Card>
        </Grid>
      </CardContent>
    </Card>
  );
};

Inventory.displayName = 'Inventory';

export default Inventory;

const styles = defineStyles({
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
  },
  innerDarkRowContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: `${theme.spacing[1]} ${theme.spacing[2]} ${theme.spacing[1]} ${theme.spacing[3]}`,
    height: '44px',
  },
  maxPerOrderField: {
    width: 'auto',
    minWidth: '72px',
    maxWidth: '88px',
  },
});
