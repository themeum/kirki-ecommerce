import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import ColorPickerField from '@/components/form/color-picker-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { CLASS_PREFIX } from '@/conf';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/molecules/flex';
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
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {type === 'color'
              ? __('Add Color', 'kirki-ecommerce')
              : __('Add Value', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <div className={`${CLASS_PREFIX}-ui-dialog-body`}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onClose}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              disabled={btnState === 'disabled'}
              onClick={form.handleSubmit(handleSubmit)}
            >
              {__('Save', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

VariationValuePopup.displayName = 'VariationValuePopup';

export default VariationValuePopup;
