import { Controller, useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import NumberField from '@/components/form/number-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WandIcon } from '@/icons';
import { generateSku } from '@/pages/products/utils';
import type { ProductFormInput } from '@/schemas/forms/product-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const Inventory = () => {
  const { control, setValue } = useFormContext<ProductFormInput>();
  const trackInventory = Boolean(
    useWatch({ control, name: 'variants.0.track_inventory' }),
  );
  const hasLimitPerOrder = Boolean(
    useWatch({ control, name: 'variants.0.has_limit_per_order' }),
  );

  const handleTrackInventoryChange = (checked: boolean) => {
    if (!checked) {
      setValue('variants.0.available_quantity', 0, { shouldDirty: true });
    }
  };

  const handleGenerateSku = () => {
    setValue('variants.0.sku', generateSku(), {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Inventory', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent cssOverride={styles.cardContent}>
        <CheckboxField
          name="variants.0.track_inventory"
          label={__('Track quantity', 'kirki-ecommerce')}
          onCheckedChange={handleTrackInventoryChange}
        />

        {trackInventory ? (
          <Card cssOverride={cardStyles.innerCard}>
            <CardContent cssOverride={cardStyles.innerContent}>
              <Grid columns={3}>
                <NumberField
                  name="variants.0.available_quantity"
                  label={__('Available', 'kirki-ecommerce')}
                  placeholder={__('600', 'kirki-ecommerce')}
                />
                <NumberField
                  name="variants.0.committed_quantity"
                  label={__('Committed', 'kirki-ecommerce')}
                  placeholder={__('600', 'kirki-ecommerce')}
                  readOnly
                  disabled
                />
                <NumberField
                  name="variants.0.min_stock_threshold"
                  label={__('Minimum stock threshold', 'kirki-ecommerce')}
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
          <Controller
            control={control}
            name="variants.0.in_stock"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="variants.0.in_stock">
                  {__('Status', 'kirki-ecommerce')}
                </FieldLabel>
                <Select
                  value={
                    field.value === undefined || field.value === null
                      ? 'true'
                      : String(field.value)
                  }
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id="variants.0.in_stock"
                    error={Boolean(fieldState.error)}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue
                      placeholder={__('In Stock', 'kirki-ecommerce')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">
                      {__('In Stock', 'kirki-ecommerce')}
                    </SelectItem>
                    <SelectItem value="false">
                      {__('Out of Stock', 'kirki-ecommerce')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}

        <Flex direction="column" gap={1}>
          <Flex justify="space-between" align="center">
            <FieldLabel
              htmlFor="variants.0.sku"
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
            name="variants.0.sku"
            placeholder={__('SKU-XYZ-1234', 'kirki-ecommerce')}
          />
        </Flex>

        <Grid gap={2} template="1fr 2fr">
          <Card cssOverride={cardStyles.innerDarkCard}>
            <CardContent cssOverride={styles.innerDarkRowContent}>
              <CheckboxField
                name="variants.0.allow_back_order"
                label={__('Sell when out of stock', 'kirki-ecommerce')}
              />
            </CardContent>
          </Card>

          <Card cssOverride={cardStyles.innerDarkCard}>
            <CardContent cssOverride={styles.innerDarkRowContent}>
              <Flex align="center" justify="space-between" gap={2}>
                <CheckboxField
                  name="variants.0.has_limit_per_order"
                  label={__(
                    'Limit orders to number of item',
                    'kirki-ecommerce',
                  )}
                  infoText={__(
                    'Limit the number of items a customer can purchase in a single order.',
                    'kirki-ecommerce',
                  )}
                />
                {hasLimitPerOrder && (
                  <NumberField
                    name="variants.0.max_per_order"
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
