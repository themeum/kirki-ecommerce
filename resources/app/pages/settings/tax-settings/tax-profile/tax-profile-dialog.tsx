import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import {
  TaxProfileFormSchema,
  type TaxProfileFormValues,
} from '@/schemas/forms/tax-profile-form';
import {
  useCreateTaxProfileMutation,
  useUpdateTaxProfileMutation,
} from '@/services/tax';
import type { TaxProfile } from '@/types';
import { __ } from '@/wpi18n';

type TaxProfilePopupProps = {
  isOpen: boolean | TaxProfile;
  onClose?: () => void;
  onSave?: (id: number) => void;
  from?: string;
  taxProfile?: TaxProfile | null;
};

export const TaxProfilePopup = ({
  isOpen,
  onClose = () => {},
  onSave = () => {},
  from = '',
  taxProfile = null,
}: TaxProfilePopupProps) => {
  const createMutation = useCreateTaxProfileMutation();
  const updateMutation = useUpdateTaxProfileMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<TaxProfileFormValues>({
    resolver: zodResolver(TaxProfileFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const nameValue = form.watch('name');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset({
      name: taxProfile?.name ?? '',
    });
  }, [isOpen, taxProfile, form]);

  const handleOnPopupClose = () => {
    form.reset({ name: '' });
    onClose();
  };

  const handleSubmit = async (values: TaxProfileFormValues) => {
    try {
      if (from === 'edit') {
        const response = await updateMutation.mutateAsync({
          id: taxProfile?.id as number,
          data: values,
        });
        onSave(response.data?.id as number);
        handleOnPopupClose();
        return;
      }

      const response = await createMutation.mutateAsync(values);
      onSave(response.data?.id as number);
      handleOnPopupClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Dialog
      open={!!isOpen}
      onOpenChange={(next) => {
        if (!next) {
          handleOnPopupClose();
        }
      }}
    >
      <DialogContent style={{ width: '400px' }}>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {__('Create tax profile', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <TextField
              name="name"
              label={__('Title', 'kirki-ecommerce')}
              placeholder={__('e.g. Books', 'kirki-ecommerce')}
            />
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
              loading={isSubmitting}
              disabled={!isSubmitting && nameValue === ''}
            >
              {from === 'edit'
                ? __('Update', 'kirki-ecommerce')
                : __('Save', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

TaxProfilePopup.displayName = 'TaxProfilePopup';
