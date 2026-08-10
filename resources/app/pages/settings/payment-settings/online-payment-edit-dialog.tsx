import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/components/ui/flex';
import { OnlinePaymentEditFormSchema, onlinePaymentEditDefaultValues, type OnlinePaymentEditFormInput, type OnlinePaymentEditFormPayload } from '@/schemas/forms/online-payment-form';
import { useUpdateOnlinePaymentMutation } from '@/services/payment';
import type { OnlinePayment } from '@/types';
import { __ } from '@/wpi18n';

import { dispatchToastMessage } from '@/pages/utils';
import { DynamicOnlinePaymentFields } from '@/pages/settings/payment-settings/utils';

type OnlinePaymentEditPopupProps = {
  editedItem: OnlinePayment | null;
  isOpen: boolean;
  onClose: () => void;
};

const OnlinePaymentEditPopup = ({
  editedItem,
  isOpen,
  onClose,
}: OnlinePaymentEditPopupProps) => {
  const { mutateAsync: updateOnlinePayment, isPending: isSubmitting } =
    useUpdateOnlinePaymentMutation();

  const form = useForm<OnlinePaymentEditFormInput, unknown, OnlinePaymentEditFormPayload>({
    resolver: zodResolver(OnlinePaymentEditFormSchema),
    defaultValues: onlinePaymentEditDefaultValues,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset(
      (editedItem?.settings as OnlinePaymentEditFormInput) ||
        onlinePaymentEditDefaultValues,
    );
  }, [isOpen, editedItem, form]);

  const handleClose = () => {
    form.reset(onlinePaymentEditDefaultValues);
    onClose();
  };

  const handleUpdateData = async (values: OnlinePaymentEditFormPayload) => {
    try {
      await updateOnlinePayment({
        id: editedItem?.id as number,
        data: {
          data: {
            ...values,
            is_enabled: true,
          },
        },
      });
      dispatchToastMessage('success', {
        title: __('Payment gateway updated', 'kirki-ecommerce'),
      });
      handleClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Dialog
      open={isOpen}
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
            {__('Edit Payment Gateways', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdateData)}>
            <DialogBody>
              <Flex direction="column" gap={4}>
                <DynamicOnlinePaymentFields fields={editedItem?.fields} />
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

OnlinePaymentEditPopup.displayName = 'OnlinePaymentEditPopup';

export default OnlinePaymentEditPopup;
