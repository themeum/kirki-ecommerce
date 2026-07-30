import type { CSSObject } from '@emotion/react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import { ShippingBoxFormSchema, shippingBoxDefaultValues, type ShippingBoxFormValues } from '@/schemas/forms/shipping-box-form';
import { useSettingsQuery } from '@/services/settings';
import { useCreateShippingBoxMutation, useUpdateShippingBoxMutation } from '@/services/shipping';
import type { ShippingBox } from '@/types';
import { theme } from '@/theme';
import { mergeCss } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import { BoxGenerator } from '@/pages/settings/shipping-settings/shipping-box/box-generator';

type ShippingBoxPopupProps = {
  selectedItem?: ShippingBox | null;
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (id?: number) => void;
};

const UNIT_TO_PX: Record<string, number> = {
  cm: 10,
  in: 25.4,
};

const convertValue = (
  value: number | string | undefined,
  fromUnit: string | undefined,
  toUnit: string,
) => {
  if (!value || fromUnit === toUnit) {
    return value;
  }

  const valueInPx = Number(value) * UNIT_TO_PX[fromUnit ?? 'in'];
  return +(valueInPx / UNIT_TO_PX[toUnit]).toFixed(2);
};

const ShippingBoxPopup = ({
  selectedItem = null,
  isOpen,
  onClose = () => {},
  onSave = () => {},
}: ShippingBoxPopupProps) => {
  const { data: productSettingsData } = useSettingsQuery('product');
  const { mutateAsync: createBox, isPending: isCreating } =
    useCreateShippingBoxMutation();
  const { mutateAsync: updateBox, isPending: isUpdating } =
    useUpdateShippingBoxMutation();
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<ShippingBoxFormValues>({
    resolver: zodResolver(ShippingBoxFormSchema),
    defaultValues: shippingBoxDefaultValues,
  });

  const length = useWatch({ control: form.control, name: 'length' });
  const width = useWatch({ control: form.control, name: 'width' });
  const height = useWatch({ control: form.control, name: 'height' });
  const unit = useWatch({ control: form.control, name: 'unit' });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset({
      length: (selectedItem?.length as number | string) ?? 120,
      width: (selectedItem?.width as number | string) ?? 80,
      height: (selectedItem?.height as number | string) ?? 80,
      unit:
        ((selectedItem?.unit as 'cm' | 'in') ??
          (productSettingsData?.dimension_unit as 'cm' | 'in') ??
          'in'),
      name: selectedItem?.name ?? '',
      is_default: (selectedItem?.is_default as boolean) || false,
    });
  }, [isOpen, selectedItem, productSettingsData, form]);

  const handleUnitChange = (newUnit: string) => {
    const nextUnit = newUnit as 'cm' | 'in';
    const values = form.getValues();
    const oldUnit = values.unit;

    form.setValue('length', convertValue(values.length, oldUnit, nextUnit) ?? 0);
    form.setValue('width', convertValue(values.width, oldUnit, nextUnit) ?? 0);
    form.setValue('height', convertValue(values.height, oldUnit, nextUnit) ?? 0);
    form.setValue('unit', nextUnit);
  };

  const handleOnclosePopup = () => {
    form.reset(shippingBoxDefaultValues);
    onClose();
  };

  const handleCreateOrUpdateBox = async (values: ShippingBoxFormValues) => {
    try {
      if (selectedItem) {
        const response = await updateBox({
          id: selectedItem?.id as number,
          data: values as Record<string, unknown>,
        });
        onSave((response?.data as { id?: number })?.id);
      } else {
        const response = await createBox({
          ...values,
          is_default: false,
        } as Record<string, unknown>);
        onSave((response?.data as { id?: number })?.id);
      }
      handleOnclosePopup();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          handleOnclosePopup();
        }
      }}
    >
      <DialogContent style={{ width: '632px' }}>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {selectedItem
              ? __('Edit Shipping Box', 'kirki-ecommerce')
              : __('Create shipping box', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody style={{ gap: '25px' }}>
            <TextField
              name="name"
              label={__('Title', 'kirki-ecommerce')}
              placeholder={__('Regular box', 'kirki-ecommerce')}
            />
            <div>
              <Card cssOverride={mergeCss(cardStyles.innerCard, styles.dimensionsCard)} >
                <CardContent cssOverride={cardStyles.innerContent}>

                <Text weight="medium" cssOverride={styles.dimensionsLabel}>{__('Dimensions', 'kirki-ecommerce')}</Text>
                <Flex gap={4} align="flex-end">
                <TextField
                name="length"
                label={__('Length', 'kirki-ecommerce')}
                placeholder={__('12', 'kirki-ecommerce')}
                type="number"
                />
                <TextField
                name="width"
                label={__('Width', 'kirki-ecommerce')}
                placeholder={__('12', 'kirki-ecommerce')}
                type="number"
                />
                <TextField
                name="height"
                label={__('Height', 'kirki-ecommerce')}
                placeholder={__('12', 'kirki-ecommerce')}
                type="number"
                />
                <Controller
                  control={form.control}
                  name="unit"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid || undefined}
                      style={{ width: '70px' }}
                    >
                      <Select
                        value={field.value}
                        onValueChange={(value) => handleUnitChange(value)}
                      >
                        <SelectTrigger
                          id="unit"
                          error={Boolean(fieldState.error)}
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">
                            {__('cm', 'kirki-ecommerce')}
                          </SelectItem>
                          <SelectItem value="in">
                            {__('in', 'kirki-ecommerce')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                </Flex>
                </CardContent>
              </Card>
              <Card cssOverride={mergeCss(cardStyles.darkCard, styles.previewCard)} >
                <CardContent>

                <BoxGenerator
                length={Number(length) || 0}
                width={Number(width) ?? 0}
                height={Number(height) ?? 0}
                unit={unit ?? 'in'}
                />
                </CardContent>
              </Card>
            </div>
          </DialogBody>
          <Separator cssOverride={styles.footerSeparator} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleOnclosePopup}
              disabled={isSubmitting}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleCreateOrUpdateBox)}
              loading={isSubmitting}
            >
              {selectedItem
                ? __('Update', 'kirki-ecommerce')
                : __('Add', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ShippingBoxPopup.displayName = 'ShippingBoxPopup';

export default ShippingBoxPopup;

const styles = {
  dimensionsCard: ({
    position: 'relative',
    overflow: 'visible',
    paddingTop: theme.spacing[5],
  } satisfies CSSObject),
  dimensionsLabel: ({
    top: '-12px',
    left: '240px',
    position: 'absolute',
    padding: `${theme.spacing[0]} ${theme.spacing[2]}`,
    backgroundColor: theme.colors.text.light,
  } satisfies CSSObject),
  previewCard: ({
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.md} ${theme.radius.md}`,
    marginTop: `-${theme.spacing[2]}`,
    padding: theme.spacing[1],
    height: '230px',
  } satisfies CSSObject),
  footerSeparator: ({
    margin: theme.spacing[0],
  } satisfies CSSObject)
};
