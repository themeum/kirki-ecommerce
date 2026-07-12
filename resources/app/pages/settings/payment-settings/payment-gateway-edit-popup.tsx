import { useEffect, useState } from 'react';

import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import { updatePaymentGatewayAPI } from '@/store/settingsSlice';
import { getErrorsObject } from '@/store/utils';
import type { FormErrors, PaymentGateway } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import { dispatchToastMessage } from '@/pages/utils';
import { getFormField } from '@/pages/settings/payment-settings/utils';

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
  const [gatewayConfObj, setGatewayConfObj] = useState<Record<string, unknown>>(
    {},
  );
  const [inputFieldType, setInputFieldType] = useState<Record<string, string>>(
    {},
  );
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editedItem?.settings) {
      setGatewayConfObj(editedItem?.settings);
    }
  }, [editedItem]);

  const handleRightAction = (key: string) => {
    setInputFieldType((prev) => ({
      ...prev,
      [key]: (prev[key] || 'password') === 'password' ? 'text' : 'password',
    }));
  };

  const handleOnChange = (value: unknown, key = '') => {
    setGatewayConfObj((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
    setErrors((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const handleUpdateData = async () => {
    const updatedObj = {
      data: {
        ...gatewayConfObj,
        is_enabled: true,
      },
    };
    const result = await updatePaymentGatewayAPI(
      editedItem?.id as number,
      updatedObj,
    );

    if (isApiSuccess(result)) {
      dispatchToastMessage('success', {
        title: __('Payment gateway updated', 'kirki-ecommerce'),
      });
      onClose();
      setGatewayConfObj({});
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
    }
  };

  return (
    <Popover isOpen={isOpen} style={{ width: '600px' }}>
      <PopoverHeader onClose={onClose}>
        {__('Edit Payment Gateways', 'kirki-ecommerce')}
      </PopoverHeader>
      <PopoverBody
        style={{
          padding:
            'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
        }}
      >
        <Flex direction="column" gap={16}>
          {editedItem?.fields?.map((field) => {
            const fieldKey = field?.name;
            const isSecret = fieldKey.includes('secret');
            const currentType =
              inputFieldType[fieldKey] || (isSecret ? 'password' : 'text');
            return (
              <div key={fieldKey}>
                {getFormField(
                  field,
                  handleOnChange,
                  fieldKey,
                  handleRightAction,
                  currentType,
                  gatewayConfObj,
                  errors,
                )}
              </div>
            );
          })}
        </Flex>
      </PopoverBody>
      <PopoverFooter>
        <Button
          type="secondary"
          size="small"
          text={__('Cancel', 'kirki-ecommerce')}
          onClick={onClose}
        />
        <Button
          type="primary"
          size="small"
          text={__('Save', 'kirki-ecommerce')}
          onClick={handleUpdateData}
        />
      </PopoverFooter>
    </Popover>
  );
};

export default PaymentGatewayEditPopup;
