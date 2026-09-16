import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';

import type { TaxProfile } from '@/features/settings/tax/shared/schemas/catalog/tax';
import {
  type TaxProfileFormInput,
  type TaxProfileFormPayload,
  TaxProfileFormSchema,
} from '@/features/settings/tax/shared/schemas/forms/tax-profile-form';
import {
  useCreateTaxProfileMutation,
  useUpdateTaxProfileMutation,
} from '@/features/settings/tax/shared/services/tax';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';

type UseTaxProfileFormParams = {
  isOpen: boolean;
  editingProfile?: TaxProfile | null;
  onClose?: () => void;
  onSave?: (id: number) => void;
};

type UseTaxProfileFormResult = {
  form: UseFormReturn<TaxProfileFormInput, unknown, TaxProfileFormPayload>;
  isSubmitting: boolean;
  isSaveDisabled: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
};

const defaultValues = {
  name: '',
  is_default: false,
};

export const useTaxProfileForm = ({
  isOpen,
  editingProfile = null,
  onClose,
  onSave,
}: UseTaxProfileFormParams): UseTaxProfileFormResult => {
  const { mutateAsync: createTaxProfile, isPending: isCreating } = useCreateTaxProfileMutation();
  const { mutateAsync: updateTaxProfile, isPending: isUpdating } = useUpdateTaxProfileMutation();
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<TaxProfileFormInput, unknown, TaxProfileFormPayload>({
    resolver: zodResolver(TaxProfileFormSchema),
    defaultValues,
  });

  const profileTitle = useWatch({ control: form.control, name: 'name' });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset({
      name: editingProfile?.name ?? '',
      is_default: editingProfile?.is_default ?? false,
    });
  }, [isOpen, editingProfile, form]);

  const handleClose = () => {
    form.reset(defaultValues);
    onClose?.();
  };

  const handleAddOrUpdateTaxProfile = async (payload: TaxProfileFormPayload) => {
    try {
      const response = editingProfile
        ? await updateTaxProfile({ id: editingProfile.id, data: payload })
        : await createTaxProfile(payload);

      onSave?.(response.data?.id);
      handleClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return {
    form,
    isSubmitting,
    isSaveDisabled: !isSubmitting && profileTitle === '',
    handleClose,
    handleSubmit: form.handleSubmit(handleAddOrUpdateTaxProfile),
  };
};
