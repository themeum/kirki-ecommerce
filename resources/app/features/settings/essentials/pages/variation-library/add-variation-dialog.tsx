import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import {
  type AddVariationFormInput,
  type AddVariationFormPayload,
  AddVariationFormSchema,
} from '@/features/products';
import { useCreateAttributeMutation } from '@/features/products';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import type { ButtonState } from '@/types/components/common';
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

  const form = useForm<AddVariationFormInput, unknown, AddVariationFormPayload>({
    resolver: zodResolver(AddVariationFormSchema),
    defaultValues: {
      name: '',
      type: variationType,
    },
  });

  const nameValue = form.watch('name');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset({ name: '', type: variationType });
  }, [isOpen, variationType, form]);

  const handleClosePopup = () => {
    form.reset({ name: '', type: variationType });
    onClose();
  };

  const handleSubmit = async (payload: AddVariationFormPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      form.reset({ name: '', type: variationType });
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
