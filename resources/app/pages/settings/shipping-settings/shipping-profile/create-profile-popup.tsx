import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
    <div>
      <Popover isOpen={isOpen} style={{ width: '400px' }}>
        <PopoverHeader
          style={{ padding: 'var(--decom-spacing-5)' }}
          onClose={handleOnPopupClose}
        >
          {__('Create shipping profile', 'kirki-ecommerce')}
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
              placeholder={__('e.g. Fragile', 'kirki-ecommerce')}
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
              text={__('Save', 'kirki-ecommerce')}
              size="small"
              onClick={form.handleSubmit(handleAddOrUpdateShippingProfile)}
              state={
                buttonState || isSubmitting ? 'disabled' : undefined
              }
            />
          </PopoverFooter>
        </Form>
      </Popover>
    </div>
  );
};

CreateProfilePopup.displayName = 'CreateProfilePopup';
