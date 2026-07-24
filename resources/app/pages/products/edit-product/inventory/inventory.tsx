import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import CheckboxField from '@/components/form/checkbox-field';
import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Form, FormField, FormItem } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { WandIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import { useProductForm } from '@/contexts/product-form-context';
import {
  mapProductInventoryFromProduct,
  ProductInventoryFormSchema,
  productInventoryDefaultValues,
  type ProductInventoryFormValues,
} from '@/schemas/forms/product-inventory-form';
import type { FormErrors } from '@/types';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

type InventoryProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  formSyncKey?: number;
};

const productLevelFields: (keyof ProductInventoryFormValues)[] = [
  'has_limit_per_order',
  'max_per_order',
];

const Inventory = ({ errors, setErrors, formSyncKey = 0 }: InventoryProps) => {
  const { product: productData, updateProduct } = useProductForm();

  const form = useForm<ProductInventoryFormValues>({
    resolver: zodResolver(ProductInventoryFormSchema),
    defaultValues: productInventoryDefaultValues,
  });

  const trackInventory = Boolean(form.watch('track_inventory'));
  const hasLimitPerOrder = Boolean(form.watch('has_limit_per_order'));
  const skuError = form.formState.errors.sku?.message;

  useEffect(() => {
    form.reset(mapProductInventoryFromProduct(productData));
  }, [formSyncKey]);

  useEffect(() => {
    const hasErrors = Object.values(errors).some(Boolean);
    if (!hasErrors) {
      return;
    }
    applyServerErrors(form, { errors } as ErrorResponse, {
      stripPrefix: 'variants.0.',
    });
  }, [errors]);

  useEffect(() => {
    const subscription = form.watch((values, info) => {
      if (info.type !== 'change' || !info.name) {
        return;
      }

      const fieldName = info.name as keyof ProductInventoryFormValues;
      const value = values[fieldName];
      const isProductLevel = productLevelFields.includes(fieldName);

      updateProduct({
        key: fieldName,
        value,
        variants: !isProductLevel,
      });

      if (fieldName === 'track_inventory') {
        updateProduct({
          key: 'available_quantity',
          value: 0,
          variants: true,
        });
        if (values.available_quantity !== 0) {
          form.setValue('available_quantity', 0);
        }
      }

      form.clearErrors(fieldName);
      setErrors((prev) => ({
        ...prev,
        [isProductLevel ? fieldName : `variants.0.${fieldName}`]: null,
      }));
    });

    return () => subscription.unsubscribe();
  }, [form, updateProduct, setErrors]);

  return (
    <Form {...form}>
      <Card css={cardStyles.formCard}>
        <CardHeader>
          <CardTitle>{__('Inventory', 'kirki-ecommerce')}</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckboxField
            name="track_inventory"
            label={__('Track quantity', 'kirki-ecommerce')}
          />

          {trackInventory ? (
            <Card css={cardStyles.innerCard}>
              <CardContent css={cardStyles.innerContent}>
                <Grid columns={3}>
                  <TextField
                    name="available_quantity"
                    label={__('Available', 'kirki-ecommerce')}
                    placeholder={__('600', 'kirki-ecommerce')}
                    type="number"
                  />
                  <TextField
                    name="committed_quantity"
                    label={__('Committed', 'kirki-ecommerce')}
                    placeholder={__('600', 'kirki-ecommerce')}
                    type="number"
                    disabled
                  />
                  <Flex direction="column" gap={8}>
                    <Label helpText={__('Minimum stock threshold', 'kirki-ecommerce')}>
                      {__('Minimum stock threshold', 'kirki-ecommerce')}
                    </Label>
                    <Input
                      placeholder={__('600', 'kirki-ecommerce')}
                      type="number"
                    />
                  </Flex>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <SelectField
              name="in_stock"
              label={__('Status', 'kirki-ecommerce')}
              options={[
                { label: __('In Stock', 'kirki-ecommerce'), value: 'true' },
                {
                  label: __('Out of Stock', 'kirki-ecommerce'),
                  value: 'false',
                },
              ]}
            />
          )}

          <Flex gap={8} direction="column">
            <Flex style={{ justifyContent: 'space-between' }}>
              <Label helpText={skuError || __('SKU (Stock Keeping Unit)', 'kirki-ecommerce')}>
                {__('SKU', 'kirki-ecommerce')}
              </Label>
              <Button variant="ghost" size="icon">
                <WandIcon />
              </Button>
            </Flex>
            <TextField
              name="sku"
              placeholder={__('SKU-XYZ-1234', 'kirki-ecommerce')}
              description={__('SKU (Stock Keeping Unit)', 'kirki-ecommerce')}
            />
          </Flex>
          <Flex gap={8}>
            {trackInventory && (
              <Card css={[cardStyles.innerDarkCard, styles.innerDarkNarrowCard]}>
                <CardContent css={cardStyles.innerDarkContent}>
                  <Flex gap={8} style={{ alignItems: 'center' }}>
                    <Checkbox id="sell-when-out-of-stock" defaultChecked />
                    <Label htmlFor="sell-when-out-of-stock">
                      {__('Sell when out of stock', 'kirki-ecommerce')}
                    </Label>
                  </Flex>
                </CardContent>
              </Card>
            )}

            <Card css={cardStyles.innerDarkCard}>
              <CardContent css={styles.innerDarkRowContent}>
              <Flex gap={30} style={{ justifyContent: 'space-between' }}>
                <FormField
                  control={form.control}
                  name="has_limit_per_order"
                  render={({ field }) => (
                    <FormItem>
                      <Flex gap={8} style={{ alignItems: 'center' }}>
                        <Checkbox
                          id="has-limit-per-order"
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                        <Label
                          htmlFor="has-limit-per-order"
                          helpText={__(
                            'Limit orders to number of item',
                            'kirki-ecommerce',
                          )}
                        >
                          {__(
                            'Limit orders to number of item',
                            'kirki-ecommerce',
                          )}
                        </Label>
                      </Flex>
                    </FormItem>
                  )}
                />
                <span
                  style={{
                    maxWidth: '88px',
                    visibility: hasLimitPerOrder ? 'visible' : 'hidden',
                  }}
                >
                  <TextField name="max_per_order" />
                </span>
              </Flex>
              </CardContent>
            </Card>
          </Flex>
        </CardContent>
      </Card>
    </Form>
  );
};

Inventory.displayName = 'Inventory';

export default Inventory;

const styles = {
  innerDarkNarrowCard: scoped({
    width: '30%',
  }),
  innerDarkRowContent: scoped({
    padding: '4px 8px 4px 12px',
  })
};
