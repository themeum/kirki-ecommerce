import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import WeightField from '@/components/form/weight-field';
import ShippingBoxField from '@/components/form/shipping-box-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import Flex from '@/components/ui/flex';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { useProductForm } from '@/contexts/product-form-context';
import {
  mapProductShippingFromProduct,
  ProductShippingFormSchema,
  productShippingDefaultValues,
  type ProductShippingFormValues,
} from '@/schemas/forms/product-shipping-form';
import { cardStyles } from '@/theme/card-styles';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import ShippingProfile from '@/pages/products/edit-product/shipping/shipping-profile';

type ShippingProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  formSyncKey?: number;
};

type SelectInputValue = {
  value?: string | number;
  unit?: string | number;
};

const Shipping = ({ errors, setErrors, formSyncKey = 0 }: ShippingProps) => {
  const { product: productData, updateProduct } = useProductForm();

  const form = useForm<ProductShippingFormValues>({
    resolver: zodResolver(ProductShippingFormSchema),
    defaultValues: productShippingDefaultValues,
  });

  useEffect(() => {
    form.reset(mapProductShippingFromProduct(productData));
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

  const syncVariantField = (
    fieldName: keyof ProductShippingFormValues,
    value: unknown,
  ) => {
    form.setValue(fieldName, value as never, {
      shouldDirty: true,
      shouldTouch: true,
    });
    form.clearErrors(fieldName);
    updateProduct({ key: fieldName, value, variants: true });
    setErrors((prev) => ({
      ...prev,
      [`variants.0.${fieldName}`]: null,
    }));
  };

  const handleOnVariantInfoChange = (value: unknown, fieldName: string) => {
    if (fieldName === 'weight') {
      const weightValue = value as SelectInputValue;
      syncVariantField('weight', weightValue.value);
      syncVariantField('weight_unit', weightValue.unit);
      return;
    }

    syncVariantField(fieldName as keyof ProductShippingFormValues, value);
  };

  return (
    <Form {...form}>
      <Card cssOverride={cardStyles.formCard}>
        <CardHeader>
          <CardTitle>{__('Shipping', 'kirki-ecommerce')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Flex direction="column" gap={2}>
            <WeightField
              name="weight"
              unitName="weight_unit"
              label={__('Weight', 'kirki-ecommerce')}
              onFieldChange={handleOnVariantInfoChange}
            />
            <ShippingBoxField
              name="shipping_box_id"
              onFieldChange={handleOnVariantInfoChange}
            />
            <ShippingProfile
              errors={{
                shipping_profile_id:
                  form.formState.errors.shipping_profile_id?.message,
              }}
              onChange={(val, fieldName) => {
                handleOnVariantInfoChange(val, fieldName);
              }}
            />
          </Flex>
        </CardContent>
      </Card>
    </Form>
  );
};

Shipping.displayName = 'Shipping';

export default Shipping;
