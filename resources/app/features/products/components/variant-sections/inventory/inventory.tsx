import { useFormContext } from 'react-hook-form';

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
import {
  useVariantField,
  useVariantValues,
} from '@/features/products/components/variant-sections/use-variant-field';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';
import { RefreshCcw } from 'lucide-react';

type InventoryProps = {
  onGenerateSku: () => void;
  isGeneratingSku: boolean;
  committedQuantity?: number | null;
};

const Inventory = ({ onGenerateSku, isGeneratingSku }: InventoryProps) => {
  const field = useVariantField();
  const { setValue, getValues } = useFormContext();
  const variant = useVariantValues(['track_inventory', 'has_limit_per_order']);

  const trackInventory = Boolean(variant.track_inventory);
  const hasLimitPerOrder = Boolean(variant.has_limit_per_order);
  const committedQuantity = getValues(field('committed_quantity'));

  const handleTrackInventoryChange = (checked: boolean) => {
    if (!checked) {
      setValue(field('available_quantity'), 0, { shouldDirty: true });
    }
  };

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Inventory', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent cssOverride={styles.cardContent}>
        <CheckboxField
          name={field('track_inventory')}
          label={__('Track quantity', 'kirki-ecommerce')}
          onCheckedChange={handleTrackInventoryChange}
        />

        {trackInventory ? (
          <Grid columns={3}>
            <NumberField
              name={field('available_quantity')}
              label={__('Available', 'kirki-ecommerce')}
              placeholder={__('0', 'kirki-ecommerce')}
            />
            <Field>
              <FieldLabel htmlFor="committed_quantity">
                {__('Committed', 'kirki-ecommerce')}
              </FieldLabel>
              <Input
                id="committed_quantity"
                type="number"
                value={committedQuantity ?? ''}
                placeholder={__('0', 'kirki-ecommerce')}
                readOnly
                disabled
              />
            </Field>
            <NumberField
              name={field('low_stock_threshold')}
              label={__('Low stock threshold', 'kirki-ecommerce')}
              infoText={__('Notify when stock falls below this amount.', 'kirki-ecommerce')}
              placeholder={__('0', 'kirki-ecommerce')}
            />
          </Grid>
        ) : (
          <SelectField
            name={field('in_stock')}
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
              htmlFor={field('sku')}
              infoText={__('SKU (Stock Keeping Unit)', 'kirki-ecommerce')}
            >
              {__('SKU (Stock keeping unit)', 'kirki-ecommerce')}
            </FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onGenerateSku}
              loading={isGeneratingSku}
              aria-label={__('Generate SKU', 'kirki-ecommerce')}
              cssOverride={{
                color: theme.colors.icon.brand,
                '&:hover': {
                  color: theme.colors.icon.brand,
                },
              }}
            >
              <RefreshCcw />
              {__('Generate', 'kirki-ecommerce')}
            </Button>
          </Flex>
          <TextField name={field('sku')} placeholder={__('BLU-RED-NIK-001', 'kirki-ecommerce')} />
        </Flex>

        <Flex direction="column" gap={4}>
          <CheckboxField
            name={field('has_limit_per_order')}
            label={__('Limit orders to number of item', 'kirki-ecommerce')}
            infoText={__(
              'Limit the number of items a customer can purchase in a single order.',
              'kirki-ecommerce',
            )}
          />
          {hasLimitPerOrder && <NumberField name={field('max_per_order')} placeholder="0" />}
          <CheckboxField
            name={field('allow_back_order')}
            label={__('Sell when out of stock', 'kirki-ecommerce')}
          />
        </Flex>
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
