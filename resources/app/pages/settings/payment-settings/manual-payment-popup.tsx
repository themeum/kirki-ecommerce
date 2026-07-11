import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import ThumbnailSelector from '@/components/thumbnail-selector';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import RichText from '@/molecules/rich-text';
import Text from '@/molecules/text';
import {
  createPaymentMethodAPI,
  updatePaymentMethodAPI,
} from '@/store/settingsSlice';
import { getErrorsObject } from '@/store/utils';
import type { FormErrors, MediaChangePayload, PaymentMethod } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __, sprintf } from '@/wpi18n';

type ManualPaymentFormData = PaymentMethod & {
  description?: string;
  instructions?: string;
  icon?: string;
  is_manual?: boolean;
  is_enabled?: boolean;
};

type ManualPaymentPopupProps = {
  openPopup: boolean;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
  setIsMethodListUpdated: Dispatch<SetStateAction<boolean>>;
  editingMethod: PaymentMethod | null;
  setEditingMethod: Dispatch<SetStateAction<PaymentMethod | null>>;
};

const ManualPaymentPopup = (props: ManualPaymentPopupProps) => {
  const {
    openPopup,
    setOpenPopup,
    setIsMethodListUpdated,
    editingMethod,
    setEditingMethod,
  } = props;
  const [icon, setIcon] = useState('');
  const [manualPaymentData, setManualPaymentData] =
    useState<ManualPaymentFormData>({} as ManualPaymentFormData);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editingMethod) {
      setManualPaymentData(editingMethod as ManualPaymentFormData);
      setIcon((editingMethod?.icon as string) || '');
    }
  }, [editingMethod]);

  const handleOnChange = (value: unknown, key: string) => {
    setManualPaymentData((prev) => {
      if (key === 'icon') {
        const media = value as MediaChangePayload;
        setIcon(media?.url || '');
        return {
          ...prev,
          [key]: media?.url,
        };
      }
      return {
        ...prev,
        [key]: value,
        ['is_manual']: true,
      };
    });

    setErrors((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const handleSaveOrUpdateData = async () => {
    const isEdit = Boolean(editingMethod);
    const result = isEdit
      ? await updatePaymentMethodAPI(
          editingMethod!.id,
          manualPaymentData as Record<string, unknown>,
        )
      : await createPaymentMethodAPI(
          manualPaymentData as Record<string, unknown>,
        );

    if (!isApiSuccess(result)) {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
      return;
    }
    setIcon('');
    setManualPaymentData({} as ManualPaymentFormData);
    setOpenPopup(false);
    setEditingMethod(null);
    setIsMethodListUpdated(true);
  };

  return (
    <>
      <Popover isOpen={openPopup} style={{ width: '600px' }}>
        <PopoverHeader
          style={{ padding: 'var(--decom-spacing-5)' }}
          onClose={() => setOpenPopup(false)}
        >
          {__('Add Manual Payment Method', 'kirki-ecommerce')}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding:
              'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
          }}
        >
          <Flex direction="column" gap={16}>
            <Input
              label={__('Method Name', 'kirki-ecommerce')}
              value={(manualPaymentData?.name as string) || ''}
              placeholder={__(
                'e.g. Cash on Delivery (COD)',
                'kirki-ecommerce',
              )}
              onChange={(value) => handleOnChange(value, 'name')}
              error={errors['name'] as string | boolean | undefined}
            />
            <ThumbnailSelector
              label={__('Icon', 'kirki-ecommerce')}
              helpText={__('Icon', 'kirki-ecommerce')}
              src={icon}
              placeholder={__(
                'Recommended image size: 48x48',
                'kirki-ecommerce',
              )}
              onChange={(img) => handleOnChange(img, 'icon')}
              error={errors['icon'] as string | boolean | undefined}
            />
            <Flex direction="column" gap={8}>
              <RichText
                label={__('Payment Instructions', 'kirki-ecommerce')}
                placeholder={__(
                  'Type instructions related to payment method',
                  'kirki-ecommerce',
                )}
                value={sprintf(
                  __('%s', 'kirki-ecommerce'),
                  (manualPaymentData?.description as string) || '',
                )}
                onChange={(value) => handleOnChange(value, 'instructions')}
              />
              <Text
                subHeader={__(
                  'Provide clear, step-by-step instructions on how to complete the payment',
                  'kirki-ecommerce',
                )}
                type="xsm"
              />
            </Flex>
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="secondary"
            size="small"
            text={__('Cancel', 'kirki-ecommerce')}
            onClick={() => setOpenPopup(false)}
          />
          <Button
            type="primary"
            size="small"
            text={__('Save', 'kirki-ecommerce')}
            onClick={handleSaveOrUpdateData}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};

export default ManualPaymentPopup;
