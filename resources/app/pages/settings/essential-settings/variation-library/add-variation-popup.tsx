import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
  AddVariationFormSchema,
  type AddVariationFormValues,
} from '@/schemas/forms/add-variation-form';
import { useCreateAttributeMutation } from '@/services/attribute';
import type { AttributeFormData, ButtonState } from '@/types';
import { __ } from '@/wpi18n';

type AddVariationPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  variationType: string | null;
};

const AddVariationPopup = ({
  isOpen,
  onClose,
  variationType,
}: AddVariationPopupProps) => {
  const createMutation = useCreateAttributeMutation();

  const form = useForm<AddVariationFormValues>({
    resolver: zodResolver(AddVariationFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const nameValue = form.watch('name');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset({ name: '' });
  }, [isOpen, form]);

  const handleClosePopup = () => {
    form.reset({ name: '' });
    onClose();
  };

  const handleSubmit = async (values: AddVariationFormValues) => {
    const newAttribute: AttributeFormData = {
      name: values.name,
      type: variationType ?? undefined,
    };

    try {
      await createMutation.mutateAsync(newAttribute);
      form.reset({ name: '' });
      onClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
      form.setValue('name', '');
    }
  };

  const buttonState: ButtonState = nameValue === '' ? 'disabled' : '';

  return (
    <div>
      <Popover
        isOpen={isOpen}
        style={{ width: '400px' }}
        onClose={handleClosePopup}
      >
        <PopoverHeader
          style={{ padding: 'var(--decom-spacing-5)' }}
          onClose={handleClosePopup}
        >
          {__('Add Variation Name', 'kirki-ecommerce')}
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
                name="name"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={__(
                  variationType === 'color' ? 'e.g Color' : 'e.g Material',
                  'kirki-ecommerce',
                )}
              />
            </Flex>
          </PopoverBody>
          <PopoverFooter>
            <Button
              text={__('Cancel', 'kirki-ecommerce')}
              type="outlined"
              size="small"
              onClick={handleClosePopup}
            />
            <Button
              text={__('Save', 'kirki-ecommerce')}
              type="primary"
              size="small"
              state={
                createMutation.isPending ? 'loading' : buttonState
              }
              onClick={form.handleSubmit(handleSubmit)}
            />
          </PopoverFooter>
        </Form>
      </Popover>
    </div>
  );
};

AddVariationPopup.displayName = 'AddVariationPopup';

export default AddVariationPopup;
