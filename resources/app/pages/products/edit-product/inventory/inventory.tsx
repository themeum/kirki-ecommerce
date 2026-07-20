import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form';
import { WandIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import Label from '@/molecules/label';
import Text from '@/molecules/text';
import { useProductForm } from '@/contexts/product-form-context';
import {
  mapProductInventoryFromProduct,
  ProductInventoryFormSchema,
  productInventoryDefaultValues,
  type ProductInventoryFormValues,
} from '@/schemas/forms/product-inventory-form';
import type { FormErrors } from '@/types';
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
      <Card type="form">
        <Text
          header={__('Inventory', 'kirki-ecommerce')}
          type="primary"
          padding="large"
        />
        <FormField
          control={form.control}
          name="track_inventory"
          render={({ field }) => (
            <FormItem>
              <Checkbox
                label={__('Track quantity', 'kirki-ecommerce')}
                value={Boolean(field.value)}
                onChange={field.onChange}
              />
            </FormItem>
          )}
        />

        {trackInventory ? (
          <Card type="inner">
            <Grid columns={3}>
              <FormField
                control={form.control}
                name="available_quantity"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        value={field.value as string | number | undefined}
                        label={__('Available', 'kirki-ecommerce')}
                        placeholder={__('600', 'kirki-ecommerce')}
                        type="number"
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="committed_quantity"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        value={field.value as string | number | undefined}
                        label={__('Committed', 'kirki-ecommerce')}
                        placeholder={__('600', 'kirki-ecommerce')}
                        type="number"
                        state="disabled"
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Input
                label={__('Minimum stock threshold', 'kirki-ecommerce')}
                helpText={__('Minimum stock threshold', 'kirki-ecommerce')}
                placeholder={__('600', 'kirki-ecommerce')}
                type="number"
              />
            </Grid>
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
            <Label
              text={__('SKU', 'kirki-ecommerce')}
              helpText={
                skuError || __('SKU (Stock Keeping Unit)', 'kirki-ecommerce')
              }
            />
            <Button type="blank" icon={<WandIcon />} />
          </Flex>
          <TextField
            name="sku"
            placeholder={__('SKU-XYZ-1234', 'kirki-ecommerce')}
            description={__('SKU (Stock Keeping Unit)', 'kirki-ecommerce')}
          />
        </Flex>
        <Flex gap={8}>
          {trackInventory && (
            <Card type="innerDark" style={{ width: '30%' }}>
              <Checkbox
                label={__('Sell when out of stock', 'kirki-ecommerce')}
                value={true}
              />
            </Card>
          )}

          <Card type="innerDark" style={{ padding: '4px 8px 4px 12px' }}>
            <Flex gap={30} style={{ justifyContent: 'space-between' }}>
              <FormField
                control={form.control}
                name="has_limit_per_order"
                render={({ field }) => (
                  <FormItem>
                    <Checkbox
                      value={Boolean(field.value)}
                      label={__(
                        'Limit orders to number of item',
                        'kirki-ecommerce',
                      )}
                      helpText={__(
                        'Limit orders to number of item',
                        'kirki-ecommerce',
                      )}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />
              <span style={{ maxWidth: '88px' }}>
                <FormField
                  control={form.control}
                  name="max_per_order"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          style={{
                            visibility: hasLimitPerOrder
                              ? 'visible'
                              : 'hidden',
                          }}
                          value={field.value || 1}
                          onChange={field.onChange}
                          error={fieldState.error?.message}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </span>
            </Flex>
          </Card>
        </Flex>
      </Card>
    </Form>
  );
};

Inventory.displayName = 'Inventory';

export default Inventory;
