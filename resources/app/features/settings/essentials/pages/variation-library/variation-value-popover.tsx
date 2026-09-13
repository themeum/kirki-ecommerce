import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, type RefObject, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import ColorPickerField from '@/components/form/color-picker-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Attribute, AttributeValue } from '@/features/products';
import {
  type VariationValueFormInput,
  type VariationValueFormPayload,
  VariationValueFormSchema,
} from '@/features/products';
import { useCreateAttributeValueMutation, useUpdateAttributeValueMutation } from '@/features/products';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { ButtonState } from '@/types/components/common';
import { getHexFromColorName } from '@/utils/color';
import { __ } from '@/wpi18n';

type VariationValuePopoverProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type?: string;
  selectedItem?: Attribute;
  editedItem?: AttributeValue | null;
  anchorRef?: RefObject<HTMLElement | null>;
  children?: ReactNode;
};

const VariationValuePopover = ({
  isOpen,
  onOpenChange,
  type,
  selectedItem,
  editedItem = null,
  anchorRef,
  children,
}: VariationValuePopoverProps) => {
  const autoFilledColorRef = useRef('');
  const createMutation = useCreateAttributeValueMutation();
  const updateMutation = useUpdateAttributeValueMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<VariationValueFormInput, unknown, VariationValueFormPayload>({
    resolver: zodResolver(VariationValueFormSchema),
    defaultValues: {
      value: '',
      color: '',
      type,
      attribute_id: selectedItem?.id,
      value_id: editedItem?.id,
    },
  });

  const valueField = form.watch('value');
  const colorField = form.watch('color');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    autoFilledColorRef.current = '';
    form.reset({
      value: editedItem?.value || '',
      color: editedItem?.color || '',
      type,
      attribute_id: selectedItem?.id,
      value_id: editedItem?.id,
    });
  }, [isOpen, editedItem, selectedItem, type, form]);

  const handleSubmit = async (payload: VariationValueFormPayload) => {
    try {
      if (editedItem?.id) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      form.reset({ value: '', color: '', type });
      onOpenChange(false);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleValueBlur = () => {
    if (type !== 'color' || editedItem) {
      return;
    }

    const hex = getHexFromColorName(form.getValues('value') ?? '');
    const currentColor = form.getValues('color') ?? '';

    if (!hex || (currentColor && currentColor !== autoFilledColorRef.current)) {
      return;
    }

    autoFilledColorRef.current = hex;
    form.setValue('color', hex, { shouldValidate: true });
  };

  const handleOpenAutoFocus = (event: Event) => {
    event.preventDefault();

    const content = event.currentTarget;

    if (!(content instanceof HTMLElement)) {
      return;
    }

    content.querySelector('input')?.focus();
  };

  const btnState: ButtonState =
    valueField === '' || (type === 'color' && colorField === '')
      ? 'disabled'
      : '';

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      {children && <PopoverTrigger asChild>{children}</PopoverTrigger>}
      {/* Radix types `virtualRef` as non-nullable, but it reads `.current` lazily and handles an empty anchor. */}
      {anchorRef && <PopoverAnchor virtualRef={anchorRef as RefObject<HTMLElement>} />}
      <PopoverContent
        align="end"
        cssOverride={styles.content}
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Flex direction="column" gap={4}>
              <TextField
                name="value"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={
                  type === 'color'
                    ? __('Add a color', 'kirki-ecommerce')
                    : __('Add a value', 'kirki-ecommerce')
                }
                onBlur={handleValueBlur}
              />
              {type === 'color' && (
                <ColorPickerField
                  name="color"
                  label={__('Color', 'kirki-ecommerce')}
                  placeholder={__('#007ba7', 'kirki-ecommerce')}
                />
              )}
              <Flex gap={2} justify="flex-end">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={btnState === 'disabled'}
                >
                  {__('Save', 'kirki-ecommerce')}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
};

VariationValuePopover.displayName = 'VariationValuePopover';

export default VariationValuePopover;

const styles = defineStyles({
  content: {
    width: '280px',
    maxWidth: '280px',
    padding: theme.spacing[4],
  },
});
