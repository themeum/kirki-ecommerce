import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import ColorPickerField from '@/components/form/color-picker-field';
import TextField from '@/components/form/text-field';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import {
  VariationValueFormSchema,
  type VariationValueFormValues,
} from '@/schemas/forms/variation-value-form';
import {
  useCreateAttributeValueMutation,
  useUpdateAttributeValueMutation,
} from '@/services/attribute';
import type {
  Attribute,
  AttributeValue,
  AttributeValueFormData,
  ButtonState,
} from '@/types';
import { __ } from '@/wpi18n';

type VariationValuePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  type?: string;
  selectedItem?: Attribute;
  editedItem?: AttributeValue | null;
};

const VariationValuePopup = ({
  isOpen,
  onClose,
  type,
  selectedItem,
  editedItem = null,
}: VariationValuePopupProps) => {
  const createMutation = useCreateAttributeValueMutation();
  const updateMutation = useUpdateAttributeValueMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<VariationValueFormValues>({
    resolver: zodResolver(VariationValueFormSchema),
    defaultValues: {
      value: '',
      color: '',
      type,
    },
  });

  const valueField = form.watch('value');
  const colorField = form.watch('color');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset({
      value: editedItem?.value || '',
      color: editedItem?.color || '',
      type,
    });
  }, [isOpen, editedItem, type, form]);

  const handleSubmit = async (values: VariationValueFormValues) => {
    const payload = {
      attribute_id: selectedItem?.id as number,
      value: values.value,
      color: type === 'color' ? values.color : null,
      ...(editedItem?.id ? { value_id: editedItem.id } : {}),
    } as AttributeValueFormData;

    try {
      if (editedItem?.id) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      form.reset({ value: '', color: '', type });
      onClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const btnState: ButtonState =
    valueField === '' || (type === 'color' && colorField === '')
      ? 'disabled'
      : '';

  return (
    <div>
      <Popover isOpen={isOpen} style={{ width: '365px' }} onClose={onClose}>
        <PopoverHeader
          style={{ padding: 'var(--decom-spacing-5)' }}
          onClose={onClose}
        >
          {type === 'color'
            ? __('Add Color', 'kirki-ecommerce')
            : __('Add Value', 'kirki-ecommerce')}
        </PopoverHeader>
        <Form {...form}>
          <PopoverBody
            style={{
              padding:
                'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
            }}
          >
            <Flex direction="column" gap={16}>
              <TextField
                name="value"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={
                  type === 'color'
                    ? __('Cerulean', 'kirki-ecommerce')
                    : __('Add a value', 'kirki-ecommerce')
                }
              />
              {type === 'color' && (
                <ColorPickerField
                  name="color"
                  label={__('Color', 'kirki-ecommerce')}
                  placeholder={__('#007ba7', 'kirki-ecommerce')}
                />
              )}
            </Flex>
          </PopoverBody>
          <PopoverFooter>
            <Button
              text={__('Cancel', 'kirki-ecommerce')}
              type="outlined"
              size="small"
              onClick={onClose}
            />
            <Button
              text={__('Save', 'kirki-ecommerce')}
              type="primary"
              size="small"
              state={isSubmitting ? 'loading' : btnState}
              onClick={form.handleSubmit(handleSubmit)}
            />
          </PopoverFooter>
        </Form>
      </Popover>
    </div>
  );
};

VariationValuePopup.displayName = 'VariationValuePopup';

export default VariationValuePopup;
