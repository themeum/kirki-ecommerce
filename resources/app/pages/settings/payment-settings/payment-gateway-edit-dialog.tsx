import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/components/ui/flex';
import { PaymentGatewayEditFormSchema, paymentGatewayEditDefaultValues, type PaymentGatewayEditFormInput, type PaymentGatewayEditFormPayload } from '@/schemas/forms/payment-gateway-form';
import { useUpdatePaymentGatewayMutation } from '@/services/payment';
import type { PaymentGateway } from '@/types';
import { __ } from '@/wpi18n';

import { dispatchToastMessage } from '@/pages/utils';
import { DynamicGatewayFields } from '@/pages/settings/payment-settings/utils';

type PaymentGatewayField = {
  name: string;
  label?: string;
  type?: string;
};

type PaymentGatewayDetail = PaymentGateway & {
  settings?: Record<string, unknown>;
  fields?: PaymentGatewayField[];
  is_enabled?: boolean;
};

type PaymentGatewayEditPopupProps = {
  editedItem: PaymentGatewayDetail | null;
  isOpen: boolean;
  onClose: () => void;
};

const PaymentGatewayEditPopup = ({
  editedItem,
  isOpen,
  onClose,
}: PaymentGatewayEditPopupProps) => {
  const { mutateAsync: updateGateway, isPending: isSubmitting } =
    useUpdatePaymentGatewayMutation();

  const form = useForm<PaymentGatewayEditFormInput, unknown, PaymentGatewayEditFormPayload>({
    resolver: zodResolver(PaymentGatewayEditFormSchema),
    defaultValues: paymentGatewayEditDefaultValues,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset(
      (editedItem?.settings as PaymentGatewayEditFormInput) ||
        paymentGatewayEditDefaultValues,
    );
  }, [isOpen, editedItem, form]);

  const handleClose = () => {
    form.reset(paymentGatewayEditDefaultValues);
    onClose();
  };

  const handleUpdateData = async (values: PaymentGatewayEditFormPayload) => {
    try {
      await updateGateway({
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
                <DynamicGatewayFields fields={editedItem?.fields} />
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

PaymentGatewayEditPopup.displayName = 'PaymentGatewayEditPopup';

export default PaymentGatewayEditPopup;
