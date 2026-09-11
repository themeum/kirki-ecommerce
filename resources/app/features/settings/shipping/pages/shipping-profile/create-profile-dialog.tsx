import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
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
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
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
import { __ } from '@/wpi18n';

type CreateProfilePopupProps = {
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (id: number) => void;
  editIndex?: number | null;
  shippingProfileList?: ShippingProfile[];
};

export const CreateProfilePopup = ({
  isOpen,
  onClose,
  onSave,
  editIndex = null,
  shippingProfileList = [],
}: CreateProfilePopupProps) => {
  const { mutateAsync: createProfile, isPending: isCreating } = useCreateShippingProfileMutation();
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateShippingProfileMutation();
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<ShippingProfileFormInput, unknown, ShippingProfileFormPayload>({
    resolver: zodResolver(ShippingProfileFormSchema),
    defaultValues: getDefaults(ShippingProfileFormSchema),
  });

  const profileTitle = useWatch({ control: form.control, name: 'name' });

  const editingProfile = editIndex
    ? shippingProfileList.find((profile) => profile?.id === editIndex)
    : undefined;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editIndex) {
      form.reset({
        name: editingProfile?.name ?? '',
        is_default: editingProfile?.is_default ?? false,
      });
      return;
    }

    form.reset(getDefaults(ShippingProfileFormSchema));
  }, [isOpen, editIndex, editingProfile, form]);

  const handleOnPopupClose = () => {
    form.reset(getDefaults(ShippingProfileFormSchema));
    onClose?.();
  };

  const handleAddOrUpdateShippingProfile = async (payload: ShippingProfileFormPayload) => {
    try {
      if (editIndex) {
        const selectedProfile = shippingProfileList.find((profile) => profile?.id === editIndex);
        if (!selectedProfile) {
          return;
        }
        const response = await updateProfile({
          id: selectedProfile.id,
          data: payload,
        });
        onSave?.((response.data as { id: number }).id);
      } else {
        const response = await createProfile(payload);
        onSave?.((response.data as { id: number }).id);
      }
      handleOnPopupClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const buttonState = !profileTitle?.trim();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          handleOnPopupClose();
        }
      }}
    >
      <Form {...form}>
        <DialogContent cssOverride={{ width: 400 }}>
          <DialogCloseButton />
          <DialogHeader>
            <DialogTitle>{__('Create shipping profile', 'kirki-ecommerce')}</DialogTitle>
          </DialogHeader>

          <DialogBody>
            <Flex direction="column" gap="4">
              <TextField
                name="name"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={__('e.g. Fragile', 'kirki-ecommerce')}
              />
              <CheckboxField
                name="is_default"
                label={__('Set as default profile', 'kirki-ecommerce')}
              />
            </Flex>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleAddOrUpdateShippingProfile)}
              disabled={buttonState || isSubmitting}
            >
              {__('Save', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Form>
    </Dialog>
  );
};

CreateProfilePopup.displayName = 'CreateProfilePopup';
