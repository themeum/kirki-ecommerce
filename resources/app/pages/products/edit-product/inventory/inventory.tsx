import type { CSSObject } from '@emotion/react';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import CheckboxField from '@/components/form/checkbox-field';
import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import { WandIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import { useProductForm } from '@/contexts/product-form-context';
import { mapProductInventoryFromProduct, ProductInventoryFormSchema, productInventoryDefaultValues, type ProductInventoryFormValues } from '@/schemas/forms/product-inventory-form';
import type { FormErrors } from '@/types';
import { mergeCss } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import { theme } from '@/theme';

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
      <Card cssOverride={cardStyles.formCard}>
        <CardHeader>
          <CardTitle>{__('Inventory', 'kirki-ecommerce')}</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckboxField
            name="track_inventory"
            label={__('Track quantity', 'kirki-ecommerce')}
          />

          {trackInventory ? (
            <Card cssOverride={cardStyles.innerCard}>
              <CardContent cssOverride={cardStyles.innerContent}>
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
                  <Field>
                    <FieldLabel>
                      {__('Minimum stock threshold', 'kirki-ecommerce')}
                    </FieldLabel>
                    <Input
                      placeholder={__('600', 'kirki-ecommerce')}
                      type="number"
                    />
                  </Field>
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

          <Flex gap={2} direction="column">
            <Flex justify="space-between">
              <FieldLabel>{__('SKU', 'kirki-ecommerce')}</FieldLabel>
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
          <Flex gap={2}>
            {trackInventory && (
              <Card cssOverride={mergeCss(cardStyles.innerDarkCard, styles.innerDarkNarrowCard)}>
                <CardContent cssOverride={cardStyles.innerDarkContent}>
                  <Field orientation="horizontal">
                    <Checkbox id="sell-when-out-of-stock" defaultChecked />
                    <FieldLabel htmlFor="sell-when-out-of-stock">
                      {__('Sell when out of stock', 'kirki-ecommerce')}
                    </FieldLabel>
                  </Field>
                </CardContent>
              </Card>
            )}

            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={styles.innerDarkRowContent}>
              <Flex gap={8} justify="space-between">
                <Controller
                  control={form.control}
                  name="has_limit_per_order"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <Field orientation="horizontal">
                        <Checkbox
                          id="has-limit-per-order"
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                        <FieldLabel htmlFor="has-limit-per-order">
                          {__(
                            'Limit orders to number of item',
                            'kirki-ecommerce',
                          )}
                        </FieldLabel>
                      </Field>
                      <FieldDescription>
                        {__(
                          'Limit orders to number of item',
                          'kirki-ecommerce',
                        )}
                      </FieldDescription>
                    </Field>
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
  innerDarkNarrowCard: ({
    width: '30%',
  } satisfies CSSObject),
  innerDarkRowContent: ({
    padding: `${theme.spacing[1]} ${theme.spacing[2]} ${theme.spacing[1]} ${theme.spacing[3]}`,
  } satisfies CSSObject)
};
