import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/components/ui/flex';
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
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          handleClosePopup();
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {__('Add Variation Name', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <Flex direction="column" gap={4}>
              <TextField
                name="name"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={__(
                  variationType === 'color' ? 'e.g Color' : 'e.g Material',
                  'kirki-ecommerce',
                )}
              />
            </Flex>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePopup}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              loading={createMutation.isPending}
              disabled={buttonState === 'disabled'}
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

AddVariationPopup.displayName = 'AddVariationPopup';

export default AddVariationPopup;
