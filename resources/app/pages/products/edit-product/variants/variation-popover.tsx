import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import ColorPickerField from '@/components/form/color-picker-field';
import TextField from '@/components/form/text-field';
import { Form } from '@/components/ui/form';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
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

  const btnState: ButtonState =
    !titleValue || !colorValue ? 'disabled' : '';

  return (
    <Popover isOpen={isOpen} style={{ width: '365px' }} onClose={onClose}>
      <PopoverHeader style={{ padding: '20px' }} onClose={onClose}>
        {__('Add Color', 'kirki-ecommerce')}
      </PopoverHeader>
      <Form {...form}>
        <PopoverBody style={{ padding: '0 20px 20px 20px' }}>
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
        </PopoverBody>
        <PopoverFooter style={{ padding: '20px' }}>
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
            state={btnState}
            onClick={form.handleSubmit(handleNewValueSave)}
          />
        </PopoverFooter>
      </Form>
    </Popover>
  );
};

VariationPopover.displayName = 'VariationPopover';

export default VariationPopover;
