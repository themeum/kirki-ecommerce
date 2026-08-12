import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import ColorPickerField from '@/components/form/color-picker-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import {
  type ProductVariationPopoverFormInput,
  type ProductVariationPopoverFormPayload,
  ProductVariationPopoverFormSchema,
} from '@/features/products/schemas/forms/product-variation-popover-form';
import { getDefaults } from '@/libs/zod';
import type { ButtonState } from '@/types/components/common';
import { __ } from '@/wpi18n';

type VariationPopoverProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (variation: ProductVariationPopoverFormPayload) => void;
  initialValues?: ProductVariationPopoverFormPayload | null;
};

const VariationDialog = ({
  isOpen,
  onClose,
  onSave,
  initialValues,
}: VariationPopoverProps) => {
  const form = useForm<ProductVariationPopoverFormInput, unknown, ProductVariationPopoverFormPayload>({
    resolver: zodResolver(ProductVariationPopoverFormSchema),
    defaultValues: getDefaults(ProductVariationPopoverFormSchema),
  });

  const titleValue = form.watch('title');
  const colorValue = form.watch('color');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset({
      title: initialValues?.title ?? '',
      color: '',
    });
  }, [isOpen, form, initialValues]);

  const handleNewValueSave = (payload: ProductVariationPopoverFormPayload) => {
    onSave?.(payload);
    form.reset({
      title: '',
      color: '',
    });
    onClose?.();
  };

  const btnState: ButtonState = !titleValue || !colorValue ? 'disabled' : '';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          onClose?.();
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>{__('Add Color', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <Flex direction="column" gap={4}>
              <TextField
                name="title"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={__('Cerulean', 'kirki-ecommerce')}
              />
              <ColorPickerField
                name="color"
                label={__('Color', 'kirki-ecommerce')}
                placeholder={__('#007ba7', 'kirki-ecommerce')}
              />
            </Flex>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              disabled={btnState === 'disabled'}
              onClick={form.handleSubmit(handleNewValueSave)}
            >
              {__('Save', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

VariationDialog.displayName = 'VariationDialog';

export default VariationDialog;
