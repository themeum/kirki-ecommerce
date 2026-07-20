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
import Flex from '@/molecules/flex';
import {
  ProductVariationPopoverFormSchema,
  type ProductVariationPopoverFormValues,
} from '@/schemas/forms/product-variation-popover-form';
import type { ButtonState } from '@/types';
import { __ } from '@/wpi18n';

type VariationPopoverProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (variation: ProductVariationPopoverFormValues) => void;
};

const VariationPopover = ({
  isOpen,
  onClose = () => {},
  onSave = () => {},
}: VariationPopoverProps) => {
  const form = useForm<ProductVariationPopoverFormValues>({
    resolver: zodResolver(ProductVariationPopoverFormSchema),
    defaultValues: {
      title: '',
      value: '',
      color: '',
    },
  });

  const titleValue = form.watch('title');
  const colorValue = form.watch('color');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset({
      title: '',
      value: '',
      color: '',
    });
  }, [isOpen, form]);

  useEffect(() => {
    form.setValue('value', titleValue ?? '');
  }, [titleValue, form]);

  const handleNewValueSave = (values: ProductVariationPopoverFormValues) => {
    onSave({
      ...values,
      value: values.title,
    });
    form.reset({
      title: '',
      value: '',
      color: '',
    });
    onClose();
  };

  const btnState: ButtonState = !titleValue || !colorValue ? 'disabled' : '';

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
          <DialogTitle>{__('Add Color', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <div className={`${CLASS_PREFIX}-ui-dialog-body`}>
            <Flex direction="column" gap={16}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onClose}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              size="sm"
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

VariationPopover.displayName = 'VariationPopover';

export default VariationPopover;
