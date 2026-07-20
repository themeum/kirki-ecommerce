import {
  useEffect,
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form, FormField, FormItem } from '@/components/ui/form';
import { EyeClosedIcon, EyeIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import SelectInput from '@/molecules/select-input';
import Text from '@/molecules/text';
import { useProductForm } from '@/contexts/product-form-context';
import {
  mapProductShippingFromProduct,
  ProductShippingFormSchema,
  productShippingDefaultValues,
  type ProductShippingFormValues,
} from '@/schemas/forms/product-shipping-form';
import { useShippingBoxesQuery } from '@/services/shipping';
import type { FormErrors, ShippingBox } from '@/types';
import { __ } from '@/wpi18n';

import { BoxGenerator } from '@/pages/settings/shipping-settings/shipping-box/box-generator';
import ShippingBoxSelect from '@/pages/products/edit-product/shipping/shipping-box';
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

type BoxGeneratorData = ShippingBox & {
  length?: number | string;
  height?: number | string;
  width?: number | string;
  unit?: string;
};

const Shipping = ({ errors, setErrors, formSyncKey = 0 }: ShippingProps) => {
  const { product: productData, updateProduct } = useProductForm();
  const { data: shippingBoxes } = useShippingBoxesQuery({ limit: -1 });
  const [boxGeneratorData, setBoxGeneratorData] = useState<
    Partial<BoxGeneratorData>
  >({});
  const [showShippingBox, setShowShippingBox] = useState(true);

  const form = useForm<ProductShippingFormValues>({
    resolver: zodResolver(ProductShippingFormSchema),
    defaultValues: productShippingDefaultValues,
  });

  const shippingBoxId = form.watch('shipping_box_id');

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

  useEffect(() => {
    if (shippingBoxId && shippingBoxes) {
      const boxData = shippingBoxes?.find((item) => item.id === shippingBoxId);
      setBoxGeneratorData((boxData as BoxGeneratorData) || {});
    }
  }, [shippingBoxId, shippingBoxes]);

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

  const BoxGeneratorView = BoxGenerator as (props: {
    length?: number | string;
    height?: number | string;
    width?: number | string;
    unit?: string;
  }) => ReactElement;

  const weightError =
    form.formState.errors.weight?.message ||
    form.formState.errors.weight_unit?.message;

  return (
    <Form {...form}>
      <Card type="form">
        <Text
          header={__('Shipping', 'kirki-ecommerce')}
          type="primary"
          padding="large"
        />
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <SelectInput
                label={__('Weight', 'kirki-ecommerce')}
                value={{
                  value: field.value || '',
                  unit: form.getValues('weight_unit') || '',
                }}
                optionsArray={[
                  {
                    value: 'kg',
                    title: __('KG', 'kirki-ecommerce'),
                    fallback: true,
                  },
                  { value: 'g', title: __('G', 'kirki-ecommerce') },
                  { value: 'lb', title: __('LB', 'kirki-ecommerce') },
                  { value: 'oz', title: __('OZ', 'kirki-ecommerce') },
                ]}
                onChange={(value) => handleOnVariantInfoChange(value, 'weight')}
                error={weightError as string | boolean | undefined}
              />
            </FormItem>
          )}
        />
        <div>
          <Card
            type="inner"
            style={{
              position: 'relative',
              overflow: 'visible',
              marginTop: '16px',
              paddingTop: '20px',
            }}
          >
            <Flex
              style={{
                top: '-18px',
                left: '8px',
                right: '8px',
                position: 'absolute',
              }}
            >
              <span
                style={{
                  backgroundColor: '#ffffff',
                  paddingLeft: '8px',
                }}
              >
                <Text
                  type="secondary"
                  header={__('Shipping Box', 'kirki-ecommerce')}
                />
              </span>
              <ActionGroup>
                <span
                  style={{
                    backgroundColor: '#ffffff',
                    paddingRight: '8px',
                  }}
                >
                  <Button
                    type="secondary"
                    size="small"
                    leftIcon={showShippingBox ? <EyeIcon /> : <EyeClosedIcon />}
                    onClick={() => {
                      setShowShippingBox((prev) => !prev);
                    }}
                  />
                </span>
              </ActionGroup>
            </Flex>
            <Flex gap={8} direction="column">
              <ShippingBoxSelect
                value={shippingBoxId}
                errors={{
                  shipping_box_id:
                    form.formState.errors.shipping_box_id?.message,
                }}
                onChange={(value, fieldName) =>
                  handleOnVariantInfoChange(value, fieldName)
                }
              />
            </Flex>
          </Card>
          {showShippingBox && (
            <Card
              type="dark"
              style={{
                borderRadius: '0px 0px 6px 6px',
                marginTop: '-8px',
                padding: '4px',
                height: '230px',
              }}
            >
              <BoxGeneratorView
                length={boxGeneratorData?.length || 0}
                height={boxGeneratorData?.height || 0}
                width={boxGeneratorData?.width || 0}
                unit={boxGeneratorData?.unit || 'in'}
              />
            </Card>
          )}
        </div>
        <ShippingProfile
          errors={{
            shipping_profile_id:
              form.formState.errors.shipping_profile_id?.message,
          }}
          onChange={(val, fieldName) =>
            handleOnVariantInfoChange(val, fieldName)
          }
        />
      </Card>
    </Form>
  );
};

Shipping.displayName = 'Shipping';

export default Shipping;
