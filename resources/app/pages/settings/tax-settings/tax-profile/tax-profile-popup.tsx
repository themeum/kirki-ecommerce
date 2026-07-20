import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Button from '@/molecules/button';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
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
    <div>
      <Popover isOpen={!!isOpen} style={{ width: '400px' }}>
        <PopoverHeader
          style={{ padding: 'var(--decom-spacing-5)' }}
          onClose={handleOnPopupClose}
        >
          {__('Create tax profile', 'kirki-ecommerce')}
        </PopoverHeader>
        <Form {...form}>
          <PopoverBody
            style={{
              padding:
                'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
            }}
          >
            <TextField
              name="name"
              label={__('Title', 'kirki-ecommerce')}
              placeholder={__('e.g. Books', 'kirki-ecommerce')}
            />
          </PopoverBody>
          <PopoverFooter>
            <Button
              type="outlined"
              text={__('Cancel', 'kirki-ecommerce')}
              size="small"
              onClick={handleOnPopupClose}
              state={isSubmitting ? 'disabled' : undefined}
            />
            <Button
              type="primary"
              text={
                from === 'edit'
                  ? __('Update', 'kirki-ecommerce')
                  : __('Save', 'kirki-ecommerce')
              }
              size="small"
              onClick={form.handleSubmit(handleSubmit)}
              state={
                isSubmitting
                  ? 'loading'
                  : nameValue === ''
                    ? 'disabled'
                    : undefined
              }
            />
          </PopoverFooter>
        </Form>
      </Popover>
    </div>
  );
};

TaxProfilePopup.displayName = 'TaxProfilePopup';
