import {
  useEffect,
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import { Select } from '@/molecules/select';
import Separator from '@/molecules/separator';
import Text from '@/molecules/text';
import { useProductForm } from '@/contexts/product-form-context';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import {
  mapProductPriceFromProduct,
  ProductPriceFormSchema,
  productPriceDefaultValues,
  type ProductPriceFormValues,
} from '@/schemas/forms/product-price-form';
import { useTaxProfilesQuery } from '@/services/tax';
import type { FormErrors, UnitPriceValue } from '@/types';
import { __ } from '@/wpi18n';

import { TaxProfilePopup } from '@/pages/settings/tax-settings/tax-profile/tax-profile-popup';
import { calculateProfit } from '@/pages/utils';
import BaseUnitPopup from '@/pages/products/edit-product/price/base-unit-popup';

type PriceProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  formSyncKey?: number;
};

type CurrencyRef = {
  symbol?: string;
  [key: string]: unknown;
};

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
  const TaxProfilePopupView = TaxProfilePopup as (props: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: unknown) => void;
  }) => ReactElement;

  return (
    <Form {...form}>
      <Card type="form">
        <Text
          header={__('Price', 'kirki-ecommerce')}
          type="primary"
          padding="large"
        />
        <Grid columns={2}>
          <FormField
            control={form.control}
            name="price"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <Input
                    leftSymbol={(currency?.symbol as string) || '$'}
                    style={{ textIndent: '12px' }}
                    value={field.value as string | number | undefined}
                    label={__('Regular price', 'kirki-ecommerce')}
                    placeholder={__('29.00', 'kirki-ecommerce')}
                    type="number"
                    onChange={(value) => {
                      field.onChange(value);
                      syncVariantField('price', value);
                    }}
                    error={fieldState.error?.message}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sale_price"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <Input
                    value={field.value as string | number | undefined}
                    leftSymbol={(currency?.symbol as string) || '$'}
                    style={{ textIndent: '12px' }}
                    label={__('Sale price', 'kirki-ecommerce')}
                    placeholder={__('19.99', 'kirki-ecommerce')}
                    type="number"
                    onChange={(value) => {
                      field.onChange(value);
                      syncVariantField('sale_price', value);
                    }}
                    error={fieldState.error?.message}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </Grid>

        <Flex direction="column" gap={8}>
          <Card
            type="innerDark"
            style={{
              padding: '4px 8px 4px 12px',
              height: '44px',
            }}
          >
            <Flex
              style={{
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <FormField
                control={form.control}
                name="show_unit_price"
                render={({ field }) => (
                  <FormItem style={{ flex: '1' }}>
                    <Checkbox
                      style={{ flex: '1' }}
                      value={Boolean(field.value)}
                      label={__('Show unit price', 'kirki-ecommerce')}
                      helpText={__('Show unit price', 'kirki-ecommerce')}
                      onChange={(value) => {
                        field.onChange(value);
                        syncVariantField('show_unit_price', value);
                      }}
                    />
                  </FormItem>
                )}
              />
              <div>
                <Flex
                  gap={8}
                  style={{
                    flex: '2',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    visibility: showUnitPrice ? 'visible' : 'hidden',
                  }}
                >
                  <Text
                    subHeader={__('Base price per unit', 'kirki-ecommerce')}
                  />
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
          </Card>

          <Card
            type="innerDark"
            style={{
              padding: '4px 8px 4px 12px',
              height: '44px',
            }}
          >
            <Grid style={{ alignItems: 'center' }}>
              <FormField
                control={form.control}
                name="charge_taxes"
                render={({ field }) => (
                  <FormItem>
                    <Checkbox
                      value={Boolean(field.value)}
                      label={__(
                        'Charge tax on this product',
                        'kirki-ecommerce',
                      )}
                      helpText={__(
                        'Charge tax on this product',
                        'kirki-ecommerce',
                      )}
                      onChange={(value) => {
                        field.onChange(value);
                        syncVariantField('charge_taxes', value);
                      }}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_profile_id"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Select
                      value={field.value as string | number | undefined}
                      style={{
                        visibility: chargeTaxes ? 'visible' : 'hidden',
                      }}
                      btnText="Add Tax Profile"
                      onNewItemAdd={() => setOpenTaxProfilePopup(true)}
                      optionsArray={taxProfileList}
                      onChange={(value) => {
                        field.onChange(value);
                        syncVariantField('tax_profile_id', value);
                      }}
                      error={fieldState.error?.message}
                    />
                  </FormItem>
                )}
              />
            </Grid>
          </Card>
        </Flex>

        <Separator />

        <Grid columns={3}>
          <FormField
            control={form.control}
            name="cost_of_goods"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <Input
                    value={field.value || ''}
                    leftSymbol={
                      field.value ? (currency?.symbol as string) || '$' : null
                    }
                    label={__('Cost of goods', 'kirki-ecommerce')}
                    placeholder={__('--', 'kirki-ecommerce')}
                    type="number"
                    onChange={(value) => {
                      field.onChange(value);
                      syncVariantField('cost_of_goods', value);
                    }}
                    error={fieldState.error?.message}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Input
            value={calculateProfit('profit', productData?.variants[0])}
            label={__('Profit', 'kirki-ecommerce')}
            type="number"
            leftSymbol={(currency?.symbol as string) || '$'}
            state="disabled"
          />
          <Input
            value={calculateProfit('margin', productData?.variants[0])}
            label={__('Margin(%)', 'kirki-ecommerce')}
            type="number"
            state="disabled"
          />
        </Grid>
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
