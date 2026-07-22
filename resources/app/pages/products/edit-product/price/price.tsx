import {
  useEffect,
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CLASS_PREFIX } from '@/conf';
import { PlusCircleIcon } from '@/icons';
import { useProductForm } from '@/contexts/product-form-context';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import {
  mapProductPriceFromProduct,
  ProductPriceFormSchema,
  productPriceDefaultValues,
  type ProductPriceFormValues,
} from '@/schemas/forms/product-price-form';
import { useTaxProfilesQuery } from '@/services/tax';
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
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}>
        <CardContent>
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
                  <FormLabel>{__('Regular price', 'kirki-ecommerce')}</FormLabel>
                  <FormControl>
                    <div style={{ position: 'relative' }}>
                      <span
                        className={`${CLASS_PREFIX}-input-left-symbol`}
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
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sale_price"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{__('Sale price', 'kirki-ecommerce')}</FormLabel>
                  <FormControl>
                    <div style={{ position: 'relative' }}>
                      <span
                        className={`${CLASS_PREFIX}-input-left-symbol`}
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
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Grid>

          <Flex direction="column" gap={8}>
            <Card
              className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner-dark`}
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
                      <Flex gap={8} style={{ alignItems: 'center', flex: '1' }}>
                        <Checkbox
                          id="show-unit-price"
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => {
                            const value = checked === true;
                            field.onChange(value);
                            syncVariantField('show_unit_price', value);
                          }}
                        />
                        <Label
                          htmlFor="show-unit-price"
                          helpText={__('Show unit price', 'kirki-ecommerce')}
                        >
                          {__('Show unit price', 'kirki-ecommerce')}
                        </Label>
                      </Flex>
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
              className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner-dark`}
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
                      <Flex gap={8} style={{ alignItems: 'center' }}>
                        <Checkbox
                          id="charge-taxes"
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => {
                            const value = checked === true;
                            field.onChange(value);
                            syncVariantField('charge_taxes', value);
                          }}
                        />
                        <Label
                          htmlFor="charge-taxes"
                          helpText={__(
                            'Charge tax on this product',
                            'kirki-ecommerce',
                          )}
                        >
                          {__('Charge tax on this product', 'kirki-ecommerce')}
                        </Label>
                      </Flex>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_profile_id"
                  render={({ field, fieldState }) => (
                    <FormItem
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
                        <FormControl>
                          <SelectTrigger error={Boolean(fieldState.error)}>
                            <SelectValue
                              placeholder={__('Add Tax Profile', 'kirki-ecommerce')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ADD_TAX_PROFILE_VALUE}>
                            <Flex gap={8} style={{ alignItems: 'center' }}>
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
                  <FormLabel>{__('Cost of goods', 'kirki-ecommerce')}</FormLabel>
                  <FormControl>
                    <div style={{ position: 'relative' }}>
                      {field.value && (
                        <span
                          className={`${CLASS_PREFIX}-input-left-symbol`}
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
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Flex direction="column" gap={8}>
              <Label>{__('Profit', 'kirki-ecommerce')}</Label>
              <div style={{ position: 'relative' }}>
                <span
                  className={`${CLASS_PREFIX}-input-left-symbol`}
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
            <Flex direction="column" gap={8}>
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
