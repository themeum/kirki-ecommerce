import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import {
  PaymentGatewayEditFormSchema,
  paymentGatewayEditDefaultValues,
  type PaymentGatewayEditFormValues,
} from '@/schemas/forms/payment-gateway-form';
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

  const form = useForm<PaymentGatewayEditFormValues>({
    resolver: zodResolver(PaymentGatewayEditFormSchema),
    defaultValues: paymentGatewayEditDefaultValues,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset(
      (editedItem?.settings as PaymentGatewayEditFormValues) ||
        paymentGatewayEditDefaultValues,
    );
  }, [isOpen, editedItem, form]);

  const handleClose = () => {
    form.reset(paymentGatewayEditDefaultValues);
    onClose();
  };

  const handleUpdateData = async (values: PaymentGatewayEditFormValues) => {
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
    <Popover isOpen={isOpen} style={{ width: '600px' }}>
      <PopoverHeader onClose={handleClose}>
        {__('Edit Payment Gateways', 'kirki-ecommerce')}
      </PopoverHeader>
      <Form {...form}>
        <PopoverBody
          style={{
            padding:
              'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
          }}
        >
          <Flex direction="column" gap={16}>
            <DynamicGatewayFields fields={editedItem?.fields} />
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="secondary"
            size="small"
            text={__('Cancel', 'kirki-ecommerce')}
            onClick={handleClose}
            state={isSubmitting ? 'disabled' : undefined}
          />
          <Button
            type="primary"
            size="small"
            text={__('Save', 'kirki-ecommerce')}
            onClick={form.handleSubmit(handleUpdateData)}
            state={isSubmitting ? 'loading' : undefined}
          />
        </PopoverFooter>
      </Form>
    </Popover>
  );
};

PaymentGatewayEditPopup.displayName = 'PaymentGatewayEditPopup';

export default PaymentGatewayEditPopup;
