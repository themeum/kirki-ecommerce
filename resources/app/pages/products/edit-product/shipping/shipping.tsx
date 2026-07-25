import { css } from '@emotion/react';
import {
  useEffect,
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, fieldErrorStyle } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EyeClosedIcon, EyeIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { useProductForm } from '@/contexts/product-form-context';
import {
  mapProductShippingFromProduct,
  ProductShippingFormSchema,
  productShippingDefaultValues,
  type ProductShippingFormValues,
} from '@/schemas/forms/product-shipping-form';
import { useShippingBoxesQuery } from '@/services/shipping';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import type { FormErrors, ShippingBox } from '@/types';

import { __ } from '@/wpi18n';

import { BoxGenerator } from '@/pages/settings/shipping-settings/shipping-box/box-generator';
import ShippingBoxSelect from '@/pages/products/edit-product/shipping/shipping-box';
import ShippingProfile from '@/pages/products/edit-product/shipping/shipping-profile';

import { theme } from '@/theme';

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

const weightUnitOptions = [
  { value: 'kg', label: __('KG', 'kirki-ecommerce') },
  { value: 'g', label: __('G', 'kirki-ecommerce') },
  { value: 'lb', label: __('LB', 'kirki-ecommerce') },
  { value: 'oz', label: __('OZ', 'kirki-ecommerce') },
];

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
      <Card css={cardStyles.formCard}>
        <CardHeader>
          <CardTitle>{__('Shipping', 'kirki-ecommerce')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Flex direction="column" gap={2}>
            <Label>{__('Weight', 'kirki-ecommerce')}</Label>
            <Flex gap={2}>
              <div style={{ flex: 1 }}>
                <Controller
                  control={form.control}
                  name="weight"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <Input
                        id="weight"
                        type="number"
                        value={field.value ?? ''}
                        onChange={(event) => {
                          field.onChange(event.target.value);
                          handleOnVariantInfoChange(
                            {
                              value: event.target.value,
                              unit: form.getValues('weight_unit') || '',
                            },
                            'weight',
                          );
                        }}
                        error={Boolean(fieldState.error) || Boolean(weightError)}
                        aria-invalid={fieldState.invalid}
                      />
                    </Field>
                  )}
                />
              </div>
              <div style={{ width: '96px' }}>
                <Controller
                  control={form.control}
                  name="weight_unit"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <Select
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleOnVariantInfoChange(
                            {
                              value: form.getValues('weight') || '',
                              unit: value,
                            },
                            'weight',
                          );
                        }}
                      >
                        <SelectTrigger
                          id="weight_unit"
                          error={
                            Boolean(fieldState.error) || Boolean(weightError)
                          }
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weightUnitOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>
            </Flex>
            {weightError && (
              <p css={fieldErrorStyle}>{String(weightError)}</p>
            )}
          </Flex>
          <div>
            <Card
              css={cardStyles.innerCard}
              style={{
                position: 'relative',
                overflow: 'visible',
                marginTop: theme.spacing[4],
                paddingTop: theme.spacing[5],
              }}
            >
              <Flex css={css({ top: '-18px', left: '8px', right: '8px', position: 'absolute' })}>
                <span css={styles.labelBackground}>
                  <Text weight="medium">{__('Shipping Box', 'kirki-ecommerce')}</Text>
                </span>
                <ActionGroup>
                  <span css={styles.actionBackground}>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowShippingBox((prev) => !prev);
                      }}
                    >
                      {showShippingBox ? <EyeIcon /> : <EyeClosedIcon />}
                    </Button>
                  </span>
                </ActionGroup>
              </Flex>
              <Flex gap={2} direction="column">
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
                css={[cardStyles.darkCard, styles.shippingBoxPreview]}
              >
                <CardContent css={styles.darkCardContent}>
                  <BoxGeneratorView
                    length={boxGeneratorData?.length || 0}
                    height={boxGeneratorData?.height || 0}
                    width={boxGeneratorData?.width || 0}
                    unit={boxGeneratorData?.unit || 'in'}
                  />
                </CardContent>
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
        </CardContent>
      </Card>
    </Form>
  );
};

Shipping.displayName = 'Shipping';

export default Shipping;

const styles = {
  darkCardContent: scoped({
    padding: theme.spacing[1],
  }),
  shippingBoxPreview: scoped({
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.md} ${theme.radius.md}`,
    marginTop: `-${theme.spacing[2]}`,
    height: '230px',
  }),
  labelBackground: scoped({
    backgroundColor: theme.colors.background.surface,
    paddingLeft: theme.spacing[2],
  }),
  actionBackground: scoped({
    backgroundColor: theme.colors.background.surface,
    paddingRight: theme.spacing[2],
  }),
};
