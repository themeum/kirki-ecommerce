import { useEffect, useState, type Dispatch, type ReactElement, type SetStateAction } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircleIcon } from '@/icons';
import { useProductForm } from '@/contexts/product-form-context';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import { mapProductPriceFromProduct, ProductPriceFormSchema, productPriceDefaultValues, type ProductPriceFormValues } from '@/schemas/forms/product-price-form';
import { useTaxProfilesQuery } from '@/services/tax';
import { theme } from '@/theme';
import { flexCenter, scoped, defineStyles } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import type { FormErrors, UnitPriceValue } from '@/types';
import { __ } from '@/wpi18n';

import { TaxProfilePopup } from '@/pages/settings/tax-settings/tax-profile/tax-profile-dialog';
import { calculateProfit } from '@/pages/utils';
import BaseUnitPopup from '@/pages/products/edit-product/price/base-unit-dialog';

type PriceProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  formSyncKey?: number;
};

type CurrencyRef = {
  symbol?: string;
  [key: string]: unknown;
};

const ADD_TAX_PROFILE_VALUE = '__add_tax_profile__';

const Price = ({ errors, setErrors, formSyncKey = 0 }: PriceProps) => {
  const { product: productData, updateProduct } = useProductForm();
  const [openTaxProfilePopup, setOpenTaxProfilePopup] = useState(false);
  const { data: taxProfiles } = useTaxProfilesQuery({ limit: -1 });

  const form = useForm<ProductPriceFormValues>({
    resolver: zodResolver(ProductPriceFormSchema),
    defaultValues: productPriceDefaultValues,
  });

  const showUnitPrice = Boolean(form.watch('show_unit_price'));
  const chargeTaxes = Boolean(form.watch('charge_taxes'));

  useEffect(() => {
    form.reset(mapProductPriceFromProduct(productData));
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

  const taxProfileList = (taxProfiles ?? []).map((item) => ({
    value: item?.id,
    title: item?.name,
  }));

  const syncVariantField = (
    fieldName: keyof ProductPriceFormValues | 'base_price_per_unit',
    value: unknown,
  ) => {
    if (fieldName !== 'base_price_per_unit') {
      form.setValue(fieldName, value as never, {
        shouldDirty: true,
        shouldTouch: true,
      });
      form.clearErrors(fieldName);
    }

    updateProduct({
      key: fieldName,
      value,
      variants: true,
    });
    setErrors((prev) => ({
      ...prev,
      [`variants.0.${fieldName}`]: null,
    }));
  };

  const currency = productData?.currency as CurrencyRef;
  const currencySymbol = (currency?.symbol as string) || '$';
  const TaxProfilePopupView = TaxProfilePopup as (props: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: unknown) => void;
  }) => ReactElement;

  return (
    <Form {...form}>
      <Card cssOverride={cardStyles.formCard}>
        <CardHeader>
          <CardTitle>{__('Price', 'kirki-ecommerce')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Grid columns={2}>
            <Controller
              control={form.control}
              name="price"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="price">
                    {__('Regular price', 'kirki-ecommerce')}
                  </FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <span
                      css={scoped(styles.inputLeftSymbol)}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                      }}
                    >
                      {currencySymbol}
                    </span>
                    <Input
                      id="price"
                      style={{ textIndent: '12px' }}
                      value={field.value ?? ''}
                      placeholder={__('29.00', 'kirki-ecommerce')}
                      type="number"
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value);
                        syncVariantField('price', value);
                      }}
                      error={Boolean(fieldState.error)}
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="sale_price"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="sale_price">
                    {__('Sale price', 'kirki-ecommerce')}
                  </FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <span
                      css={scoped(styles.inputLeftSymbol)}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                      }}
                    >
                      {currencySymbol}
                    </span>
                    <Input
                      id="sale_price"
                      value={field.value ?? ''}
                      style={{ textIndent: '12px' }}
                      placeholder={__('19.99', 'kirki-ecommerce')}
                      type="number"
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value);
                        syncVariantField('sale_price', value);
                      }}
                      error={Boolean(fieldState.error)}
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </Grid>

          <Flex direction="column" gap={2}>
            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={styles.innerDarkRowContent}>
                <Flex align="center" justify="space-between">
                <Controller
                  control={form.control}
                  name="show_unit_price"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid || undefined}
                      style={{ flex: '1' }}
                    >
                      <Field orientation="horizontal">
                        <Checkbox
                          id="show-unit-price"
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => {
                            const value = checked === true;
                            field.onChange(value);
                            syncVariantField('show_unit_price', value);
                          }}
                        />
                        <FieldLabel htmlFor="show-unit-price">
                          {__('Show unit price', 'kirki-ecommerce')}
                        </FieldLabel>
                      </Field>
                      <FieldDescription>
                        {__('Show unit price', 'kirki-ecommerce')}
                      </FieldDescription>
                    </Field>
                  )}
                />
                <div>
                  <Flex gap={2} align="center" justify="flex-end" cssOverride={{ flex: '2', visibility: showUnitPrice ? 'visible' : 'hidden' }}>
                    <Text color="secondary">{__('Base price per unit', 'kirki-ecommerce')}</Text>
                    <BaseUnitPopup
                      errors={errors}
                      setErrors={setErrors}
                      data={productData?.variants[0]}
                      onChange={(value: UnitPriceValue) =>
                        syncVariantField('base_price_per_unit', value)
                      }
                    />
                  </Flex>
                </div>
                </Flex>
              </CardContent>
            </Card>

            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={styles.innerDarkRowContent}>
                <Grid align="center">
                <Controller
                  control={form.control}
                  name="charge_taxes"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <Field orientation="horizontal">
                        <Checkbox
                          id="charge-taxes"
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => {
                            const value = checked === true;
                            field.onChange(value);
                            syncVariantField('charge_taxes', value);
                          }}
                        />
                        <FieldLabel htmlFor="charge-taxes">
                          {__('Charge tax on this product', 'kirki-ecommerce')}
                        </FieldLabel>
                      </Field>
                      <FieldDescription>
                        {__(
                          'Charge tax on this product',
                          'kirki-ecommerce',
                        )}
                      </FieldDescription>
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="tax_profile_id"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid || undefined}
                      style={{
                        visibility: chargeTaxes ? 'visible' : 'hidden',
                      }}
                    >
                      <Select
                        value={
                          field.value === null || field.value === undefined
                            ? ''
                            : String(field.value)
                        }
                        onValueChange={(value) => {
                          if (value === ADD_TAX_PROFILE_VALUE) {
                            setOpenTaxProfilePopup(true);
                            return;
                          }
                          field.onChange(value);
                          syncVariantField('tax_profile_id', value);
                        }}
                      >
                        <SelectTrigger
                          id="tax_profile_id"
                          error={Boolean(fieldState.error)}
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue
                            placeholder={__('Add Tax Profile', 'kirki-ecommerce')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ADD_TAX_PROFILE_VALUE}>
                            <Flex gap={2} align="center">
                              <PlusCircleIcon />
                              {__('Add Tax Profile', 'kirki-ecommerce')}
                            </Flex>
                          </SelectItem>
                          {taxProfileList.length > 0 && <SelectSeparator />}
                          {taxProfileList.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={String(option.value)}
                            >
                              {option.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                </Grid>
              </CardContent>
            </Card>
          </Flex>

          <Separator />

          <Grid columns={3}>
            <Controller
              control={form.control}
              name="cost_of_goods"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="cost_of_goods">
                    {__('Cost of goods', 'kirki-ecommerce')}
                  </FieldLabel>
                  <div style={{ position: 'relative' }}>
                    {field.value && (
                      <span
                        css={scoped(styles.inputLeftSymbol)}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                        }}
                      >
                        {currencySymbol}
                      </span>
                    )}
                    <Input
                      id="cost_of_goods"
                      value={field.value ?? ''}
                      style={{ textIndent: field.value ? '12px' : undefined }}
                      placeholder={__('--', 'kirki-ecommerce')}
                      type="number"
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value);
                        syncVariantField('cost_of_goods', value);
                      }}
                      error={Boolean(fieldState.error)}
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Flex direction="column" gap={2}>
              <Label>{__('Profit', 'kirki-ecommerce')}</Label>
              <div style={{ position: 'relative' }}>
                <span
                  css={scoped(styles.inputLeftSymbol)}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                >
                  {currencySymbol}
                </span>
                <Input
                  value={calculateProfit('profit', productData?.variants[0])}
                  style={{ textIndent: '12px' }}
                  type="number"
                  disabled
                />
              </div>
            </Flex>
            <Flex direction="column" gap={2}>
              <Label>{__('Margin(%)', 'kirki-ecommerce')}</Label>
              <Input
                value={calculateProfit('margin', productData?.variants[0])}
                type="number"
                disabled
              />
            </Flex>
          </Grid>
        </CardContent>
        <TaxProfilePopupView
          isOpen={openTaxProfilePopup}
          onClose={() => setOpenTaxProfilePopup(false)}
          onSave={(value) => syncVariantField('tax_profile_id', value)}
        />
      </Card>
    </Form>
  );
};

Price.displayName = 'Price';

export default Price;

const styles = defineStyles({
  innerDarkRowContent: {
    padding: `${theme.spacing[1]} ${theme.spacing[2]} ${theme.spacing[1]} ${theme.spacing[3]}`,
    height: '44px',
    boxSizing: 'border-box',
  },
  inputLeftSymbol: {
    ...flexCenter(),
    color: theme.colors.text.secondary,
  }
});
