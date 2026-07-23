import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  ShippingProfileFormSchema,
  shippingProfileDefaultValues,
  type ShippingProfileFormValues,
} from '@/schemas/forms/shipping-profile-form';
import {
  useCreateShippingProfileMutation,
  useUpdateShippingProfileMutation,
} from '@/services/shipping';
import type { ShippingProfile } from '@/types';
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
  onClose = () => {},
  onSave = () => {},
  editIndex = null,
  shippingProfileList = [],
}: CreateProfilePopupProps) => {
  const { mutateAsync: createProfile, isPending: isCreating } =
    useCreateShippingProfileMutation();
  const { mutateAsync: updateProfile, isPending: isUpdating } =
    useUpdateShippingProfileMutation();
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<ShippingProfileFormValues>({
    resolver: zodResolver(ShippingProfileFormSchema),
    defaultValues: shippingProfileDefaultValues,
  });

  const profileTitle = useWatch({ control: form.control, name: 'name' });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editIndex) {
      const selectedProfile = shippingProfileList.find(
        (profile) => profile?.id === editIndex,
      );
      form.reset({ name: selectedProfile?.name ?? '' });
      return;
    }

    form.reset(shippingProfileDefaultValues);
  }, [isOpen, editIndex, shippingProfileList, form]);

  const handleOnPopupClose = () => {
    form.reset(shippingProfileDefaultValues);
    onClose();
  };

  const handleAddOrUpdateShippingProfile = async (
    values: ShippingProfileFormValues,
  ) => {
    try {
      if (editIndex) {
        const selectedProfile = shippingProfileList.find(
          (profile) => profile?.id === editIndex,
        );
        if (!selectedProfile) {
          return;
        }
        const response = await updateProfile({
          id: selectedProfile.id,
          data: values,
        });
        onSave((response.data as { id?: number })?.id as number);
      } else {
        const response = await createProfile(values);
        onSave((response.data as { id?: number })?.id as number);
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
      <DialogContent style={{ width: '400px' }}>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {__('Create shipping profile', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <TextField
              name="name"
              label={__('Title', 'kirki-ecommerce')}
              placeholder={__('e.g. Fragile', 'kirki-ecommerce')}
            />
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isSubmitting}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              size="sm"
              onClick={form.handleSubmit(handleAddOrUpdateShippingProfile)}
              disabled={buttonState || isSubmitting}
            >
              {__('Save', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

CreateProfilePopup.displayName = 'CreateProfilePopup';
