import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';

import type { ShippingProfile } from '@/features/settings/shipping/schemas/catalog/shipping';
import {
  type ShippingProfileFormInput,
  type ShippingProfileFormPayload,
  ShippingProfileFormSchema,
} from '@/features/settings/shipping/schemas/forms/shipping-profile-form';
import {
  useCreateShippingProfileMutation,
  useUpdateShippingProfileMutation,
} from '@/features/settings/shipping/services/shipping';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults } from '@/libs/zod';

type UseShippingProfileFormParams = {
  isOpen: boolean;
  editingProfile?: ShippingProfile;
  onClose?: () => void;
  onSave?: (id: number) => void;
};

type UseShippingProfileFormResult = {
  form: UseFormReturn<ShippingProfileFormInput, unknown, ShippingProfileFormPayload>;
  isSubmitting: boolean;
  isSaveDisabled: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
};

export const useShippingProfileForm = ({
  isOpen,
  editingProfile,
  onClose,
  onSave,
}: UseShippingProfileFormParams): UseShippingProfileFormResult => {
  const { mutateAsync: createProfile, isPending: isCreating } = useCreateShippingProfileMutation();
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateShippingProfileMutation();
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<ShippingProfileFormInput, unknown, ShippingProfileFormPayload>({
    resolver: zodResolver(ShippingProfileFormSchema),
    defaultValues: getDefaults(ShippingProfileFormSchema),
  });

  const profileTitle = useWatch({ control: form.control, name: 'name' });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingProfile) {
      form.reset({
        name: editingProfile.name ?? '',
        is_default: editingProfile.is_default ?? false,
      });
      return;
    }

    form.reset(getDefaults(ShippingProfileFormSchema));
  }, [isOpen, editingProfile, form]);

  const handleClose = () => {
    form.reset(getDefaults(ShippingProfileFormSchema));
    onClose?.();
  };

  const handleAddOrUpdateShippingProfile = async (payload: ShippingProfileFormPayload) => {
    try {
      const response = editingProfile
        ? await updateProfile({ id: editingProfile.id, data: payload })
        : await createProfile(payload);

      onSave?.((response.data as { id: number }).id);
      handleClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return {
    form,
    isSubmitting,
    isSaveDisabled: !profileTitle?.trim() || isSubmitting,
    handleClose,
    handleSubmit: form.handleSubmit(handleAddOrUpdateShippingProfile),
  };
};
