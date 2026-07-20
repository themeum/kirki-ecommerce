import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import { Popover, PopoverBody, PopoverHeader } from '@/molecules/popover';
import Separator from '@/molecules/separator';
import Text from '@/molecules/text';
import {
  ShippingBoxFormSchema,
  shippingBoxDefaultValues,
  type ShippingBoxFormValues,
} from '@/schemas/forms/shipping-box-form';
import { useSettingsQuery } from '@/services/settings';
import {
  useCreateShippingBoxMutation,
  useUpdateShippingBoxMutation,
} from '@/services/shipping';
import type { ShippingBox } from '@/types';
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
    <Popover
      isOpen={isOpen}
      onClose={handleOnclosePopup}
      style={{ width: '632px', zIndex: '1000' }}
    >
      <PopoverHeader
        style={{ padding: 'var(--decom-spacing-5)' }}
        onClose={handleOnclosePopup}
      >
        {selectedItem
          ? __('Edit Shipping Box', 'kirki-ecommerce')
          : __('Create shipping box', 'kirki-ecommerce')}
      </PopoverHeader>
      <Form {...form}>
        <PopoverBody
          style={{
            gap: '25px',
            padding:
              'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-3) var(--decom-spacing-5)',
          }}
        >
          <TextField
            name="name"
            label={__('Title', 'kirki-ecommerce')}
            placeholder={__('Regular box', 'kirki-ecommerce')}
          />
          <div>
            <Card
              type="inner"
              style={{
                position: 'relative',
                overflow: 'visible',
                paddingTop: 'var(--decom-spacing-5)',
              }}
            >
              <Text
                type="secondary"
                header={__('Dimensions', 'kirki-ecommerce')}
                style={{
                  top: '-12px',
                  left: '240px',
                  position: 'absolute',
                  padding: 'var(--decom-spacing-0) var(--decom-spacing-2)',
                  backgroundColor: 'var(--decom-text-text-light)',
                }}
              />
              <Flex gap={16} style={{ alignItems: 'flex-end' }}>
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
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field, fieldState }) => (
                    <FormItem style={{ width: '70px' }}>
                      <Select
                        value={field.value}
                        onValueChange={(value) => handleUnitChange(value)}
                      >
                        <FormControl>
                          <SelectTrigger error={Boolean(fieldState.error)}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cm">
                            {__('cm', 'kirki-ecommerce')}
                          </SelectItem>
                          <SelectItem value="in">
                            {__('in', 'kirki-ecommerce')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Flex>
            </Card>
            <Card
              type="dark"
              style={{
                borderRadius:
                  'var(--decom-radius-rounded-none) var(--decom-radius-rounded-none) var(--decom-radius-rounded-md) var(--decom-radius-rounded-md)',
                marginTop: '-8px',
                padding: 'var(--decom-spacing-1)',
                height: '230px',
              }}
            >
              <BoxGenerator
                length={Number(length) || 0}
                width={Number(width) ?? 0}
                height={Number(height) ?? 0}
                unit={unit ?? 'in'}
              />
            </Card>
          </div>
        </PopoverBody>
        <Flex
          direction={'column'}
          style={{ padding: 'var(--decom-spacing-0) var(--decom-spacing-5)' }}
        >
          <Separator style={{ margin: 'var(--decom-spacing-0)' }} />
          <ActionGroup
            style={{
              padding: 'var(--decom-spacing-3) var(--decom-spacing-0)',
              gap: 'var(--decom-spacing-2)',
            }}
          >
            <Button
              type="outlined"
              text={__('Cancel', 'kirki-ecommerce')}
              size="small"
              onClick={handleOnclosePopup}
              state={isSubmitting ? 'disabled' : undefined}
            />
            <Button
              type="primary"
              text={
                selectedItem
                  ? __('Update', 'kirki-ecommerce')
                  : __('Add', 'kirki-ecommerce')
              }
              size="small"
              onClick={form.handleSubmit(handleCreateOrUpdateBox)}
              state={isSubmitting ? 'loading' : undefined}
            />
          </ActionGroup>
        </Flex>
      </Form>
    </Popover>
  );
};

ShippingBoxPopup.displayName = 'ShippingBoxPopup';

export default ShippingBoxPopup;
