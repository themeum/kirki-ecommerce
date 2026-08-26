import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import MediaField from '@/components/form/media-field';
import RichTextField from '@/components/form/rich-text-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import type { OfflinePayment } from '@/features/settings/payment/schemas/catalog/payment';
import { type OfflinePaymentFormInput, type OfflinePaymentFormPayload, OfflinePaymentFormSchema } from '@/features/settings/payment/schemas/forms/offline-payment-form';
import { useCreateOfflinePaymentMutation, useUpdateOfflinePaymentMutation } from '@/features/settings/payment/services/payment';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults } from '@/libs/zod';
import { __ } from '@/wpi18n';

type OfflinePaymentPopupProps = {
  openPopup: boolean;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
  editingMethod: OfflinePayment | null;
  setEditingMethod: Dispatch<SetStateAction<OfflinePayment | null>>;
};

const OfflinePaymentPopup = (props: OfflinePaymentPopupProps) => {
  const { openPopup, setOpenPopup, editingMethod, setEditingMethod } = props;

  const { mutateAsync: createMethod, isPending: isCreating } =
    useCreateOfflinePaymentMutation();
  const { mutateAsync: updateMethod, isPending: isUpdating } =
    useUpdateOfflinePaymentMutation();
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<OfflinePaymentFormInput, unknown, OfflinePaymentFormPayload>({
    resolver: zodResolver(OfflinePaymentFormSchema),
    defaultValues: getDefaults(OfflinePaymentFormSchema),
  });

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    form.reset({
      name: editingMethod?.name ?? '',
      icon: editingMethod?.icon ?? '',
      instructions:
        editingMethod?.instructions ||
        ((editingMethod as OfflinePayment & { description?: string })
          ?.description ??
          ''),
      is_offline: true,
      is_enabled: editingMethod?.is_enabled ?? true,
    });
  }, [openPopup, editingMethod, form]);

  const handleClose = () => {
    form.reset(getDefaults(OfflinePaymentFormSchema));
    setOpenPopup(false);
    setEditingMethod(null);
  };

  const handleSaveOrUpdateData = async (payload: OfflinePaymentFormPayload) => {
    try {
      if (editingMethod) {
        await updateMethod({
          id: editingMethod.id,
          data: payload,
        });
      } else {
        await createMethod(payload);
      }
      handleClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Dialog
      open={openPopup}
      onOpenChange={(next) => {
        if (!next) {
          handleClose();
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {__('Add Manual Payment Method', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveOrUpdateData)}>
            <DialogBody>
              <Flex direction="column" gap={4}>
                <TextField
                  name="name"
                  label={__('Method Name', 'kirki-ecommerce')}
                  placeholder={__(
                    'e.g. Cash on Delivery (COD)',
                    'kirki-ecommerce',
                  )}
                />
                <MediaField
                  name="icon"
                  label={__('Icon', 'kirki-ecommerce')}
                  description={__('Icon', 'kirki-ecommerce')}
                  placeholder={__(
                    'Recommended image size: 48x48',
                    'kirki-ecommerce',
                  )}
                />
                <RichTextField
                  name="instructions"
                  label={__('Payment Instructions', 'kirki-ecommerce')}
                  placeholder={__(
                    'Type instructions related to payment method',
                    'kirki-ecommerce',
                  )}
                  description={__(
                    'Provide clear, step-by-step instructions on how to complete the payment',
                    'kirki-ecommerce',
                  )}
                />
              </Flex>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                >
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

OfflinePaymentPopup.displayName = 'OfflinePaymentPopup';

export default OfflinePaymentPopup;
