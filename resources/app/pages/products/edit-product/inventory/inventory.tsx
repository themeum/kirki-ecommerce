import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { Controller, useForm } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProductForm } from '@/contexts/product-form-context';
import { WandIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import {
  mapProductInventoryFromProduct,
  productInventoryDefaultValues,
  ProductInventoryFormSchema,
  type ProductInventoryFormValues,
} from '@/schemas/forms/product-inventory-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import { generateSku } from '@/pages/products/utils';

type InventoryProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  formSyncKey?: number;
};

const productLevelFields: (keyof ProductInventoryFormValues)[] = [
  'allow_back_order',
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

  const handleGenerateSku = () => {
    const value = generateSku();
    form.setValue('sku', value, {
      shouldDirty: true,
      shouldTouch: true,
    });
    updateProduct({
      key: 'sku',
      value,
      variants: true,
    });
    form.clearErrors('sku');
    setErrors((prev) => ({
      ...prev,
      'variants.0.sku': null,
    }));
  };

  return (
    <Form {...form}>
      <Card cssOverride={cardStyles.formCard}>
        <CardHeader>
          <CardTitle>{__('Inventory', 'kirki-ecommerce')}</CardTitle>
        </CardHeader>
        <CardContent cssOverride={styles.cardContent}>
          <Controller
            control={form.control}
            name="track_inventory"
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid || undefined}
                orientation="horizontal"
              >
                <Checkbox
                  id="track_inventory"
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true);
                  }}
                  aria-invalid={fieldState.invalid}
                />
                <FieldLabel htmlFor="track_inventory">
                  {__('Track quantity', 'kirki-ecommerce')}
                </FieldLabel>
              </Field>
            )}
          />

          {trackInventory ? (
            <Card cssOverride={cardStyles.innerCard}>
              <CardContent cssOverride={cardStyles.innerContent}>
                <Grid columns={3}>
                  <Controller
                    control={form.control}
                    name="available_quantity"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="available_quantity">
                          {__('Available', 'kirki-ecommerce')}
                        </FieldLabel>
                        <Input
                          id="available_quantity"
                          value={field.value ?? ''}
                          placeholder={__('600', 'kirki-ecommerce')}
                          type="number"
                          onChange={(event) => {
                            field.onChange(event.target.value);
                          }}
                          error={Boolean(fieldState.error)}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="committed_quantity"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="committed_quantity">
                          {__('Committed', 'kirki-ecommerce')}
                        </FieldLabel>
                        <Input
                          id="committed_quantity"
                          value={field.value ?? ''}
                          placeholder={__('600', 'kirki-ecommerce')}
                          type="number"
                          disabled
                          error={Boolean(fieldState.error)}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="min_stock_threshold"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel
                          htmlFor="min_stock_threshold"
                          infoText={__(
                            'Notify when stock falls below this amount.',
                            'kirki-ecommerce',
                          )}
                        >
                          {__('Minimum stock threshold', 'kirki-ecommerce')}
                        </FieldLabel>
                        <Input
                          id="min_stock_threshold"
                          value={field.value ?? ''}
                          placeholder={__('600', 'kirki-ecommerce')}
                          type="number"
                          onChange={(event) => {
                            field.onChange(event.target.value);
                          }}
                          error={Boolean(fieldState.error)}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Controller
              control={form.control}
              name="in_stock"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="in_stock">
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
                      id="in_stock"
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

          <Controller
            control={form.control}
            name="sku"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <Flex justify="space-between" align="center">
                  <FieldLabel
                    htmlFor="sku"
                    infoText={__(
                      'SKU (Stock Keeping Unit)',
                      'kirki-ecommerce',
                    )}
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
                <Input
                  id="sku"
                  value={field.value ?? ''}
                  placeholder={__('SKU-XYZ-1234', 'kirki-ecommerce')}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                  }}
                  error={Boolean(fieldState.error)}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Grid gap={2} template="1fr 2fr">
            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={styles.innerDarkRowContent}>
                <Controller
                  control={form.control}
                  name="allow_back_order"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid || undefined}
                      orientation="horizontal"
                    >
                      <Checkbox
                        id="allow_back_order"
                        checked={Boolean(field.value)}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === true);
                        }}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldLabel htmlFor="allow_back_order">
                        {__('Sell when out of stock', 'kirki-ecommerce')}
                      </FieldLabel>
                    </Field>
                  )}
                />
              </CardContent>
            </Card>

            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={styles.innerDarkRowContent}>
                <Flex align="center" justify="space-between" gap={2}>
                  <Controller
                    control={form.control}
                    name="has_limit_per_order"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid || undefined}
                        orientation="horizontal"
                      >
                        <Checkbox
                          id="has_limit_per_order"
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                          }}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel
                          htmlFor="has_limit_per_order"
                          infoText={__(
                            'Limit the number of items a customer can purchase in a single order.',
                            'kirki-ecommerce',
                          )}
                        >
                          {__(
                            'Limit orders to number of item',
                            'kirki-ecommerce',
                          )}
                        </FieldLabel>
                      </Field>
                    )}
                  />
                  {hasLimitPerOrder && (
                    <Controller
                      control={form.control}
                      name="max_per_order"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid || undefined}
                          cssOverride={styles.maxPerOrderField}
                        >
                          <Input
                            id="max_per_order"
                            value={field.value ?? ''}
                            type="number"
                            onChange={(event) => {
                              field.onChange(event.target.value);
                            }}
                            error={Boolean(fieldState.error)}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  )}
                </Flex>
              </CardContent>
            </Card>
          </Grid>
        </CardContent>
      </Card>
    </Form>
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
    boxSizing: 'border-box',
  },
  maxPerOrderField: {
    width: 'auto',
    minWidth: '72px',
    maxWidth: '88px',
  },
});
