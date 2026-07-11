import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { CartIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import Text from '@/molecules/text';
import ToggleButton from '@/molecules/toggle-button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getSettingsAPI,
  updateSettings,
  updateSettingsAPI,
} from '@/store/settingsSlice';
import { getErrorsObject } from '@/store/utils';
import type { FormErrors, SettingsSectionData } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import { dispatchToastMessage } from '../../utils';
import { checkUnsavedDataStatus, setUnsavedDataStatus } from '../utils';
import CheckoutConf from './checkout-conf';
import LegalInfo from './legal-info';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

type CheckoutConfiguration = {
  address_line_validation?: string;
  phone_number_validation?: string;
  company_name_validation?: string;
  company_id_validation?: string;
  vat_identification_number_validation?: string;
  has_apply_coupon_code?: boolean;
};

type CheckoutSettingsFormData = SettingsSectionData & {
  is_allowed_guest_checkout?: boolean;
  checkout_configuration?: CheckoutConfiguration;
  is_terms_and_conditions_visible?: boolean;
  terms_and_conditions_content?: string;
  is_privacy_policy_visible?: boolean;
  privacy_policy_content?: string;
};

const CONF_KEYS = [
  'address_line_validation',
  'phone_number_validation',
  'company_name_validation',
  'company_id_validation',
  'vat_identification_number_validation',
  'has_apply_coupon_code',
];

const initialDataObj: CheckoutSettingsFormData = {
  is_allowed_guest_checkout: false,
  checkout_configuration: {
    address_line_validation: '',
    phone_number_validation: '',
    company_name_validation: '',
    company_id_validation: '',
    vat_identification_number_validation: '',
    has_apply_coupon_code: true,
  },
  is_terms_and_conditions_visible: false,
  terms_and_conditions_content: '',
  is_privacy_policy_visible: false,
  privacy_policy_content: '',
};

const CheckoutSettings = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const [dataObj, setDataObj] =
    useState<CheckoutSettingsFormData>(initialDataObj);
  const [initialData, setInitialData] =
    useState<CheckoutSettingsFormData>(initialDataObj);
  const [errors, setErrors] = useState<FormErrors>({});

  const hasUnsavedData = useAppSelector((state) => state.unsaved?.hasUnsavedData);
  const { loaded, data: checkoutSettingsData } = useAppSelector(
    (state) => state.settings?.checkout,
  );

  useEffect(() => {
    if (!loaded) {
      dispatch(getSettingsAPI('checkout', {}));
    }
  }, []);

  useEffect(() => {
    if (!checkoutSettingsData || !Object.keys(checkoutSettingsData).length) {
      return;
    }
    const checkoutConfig =
      (checkoutSettingsData.checkout_configuration as CheckoutConfiguration) ||
      {};
    const mergedData: CheckoutSettingsFormData = {
      ...initialDataObj,
      ...checkoutSettingsData,
      checkout_configuration: {
        ...initialDataObj.checkout_configuration,
        ...checkoutConfig,
      },
    };

    setDataObj(mergedData);
    setInitialData(mergedData);
  }, [checkoutSettingsData]);

  const handleOnChange = (value: unknown, key: string) => {
    setUnsavedDataStatus(true);

    setDataObj((prev) =>
      CONF_KEYS.includes(key)
        ? {
            ...prev,
            checkout_configuration: {
              ...prev.checkout_configuration,
              [key]: value,
            },
          }
        : {
            ...prev,
            [key]: value,
          },
    );

    setErrors((prev) => ({
      ...prev,
      [CONF_KEYS.includes(key)
        ? `data.checkout_configuration.${key}`
        : `data.${key}`]: null,
    }));
  };

  const handleSaveData = async () => {
    const result = await updateSettingsAPI('checkout', dataObj);

    if (!isApiSuccess(result)) {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
      return;
    }
    dispatch(
      updateSettings({
        key: 'checkout',
        value: result.data as SettingsSectionData,
      }),
    );
    dispatchToastMessage('success', {
      title: __('Checkout settings updated', 'kirki-ecommerce'),
    });
    setUnsavedDataStatus(false);
  };

  const handleDiscardData = () => {
    setDataObj(initialData);
    setErrors({});
    setUnsavedDataStatus(false);
  };

  const handleBackButton = () => {
    checkUnsavedDataStatus({
      initialDataObj: initialData,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate('/settings'),
        }),
      onClean: () => navigate('/settings'),
    });
  };

  return (
    <>
      <PageHeading
        text={__('Settings', 'kirki-ecommerce')}
        size="sm"
        sticky
        type="primary"
        style={{ height: '32px' }}
        actions={
          hasUnsavedData ? (
            <>
              <Button
                type="ghost"
                text={__('Cancel', 'kirki-ecommerce')}
                size="small"
                onClick={handleDiscardData}
              />
              <Button
                type="primary"
                text={__('Save', 'kirki-ecommerce')}
                size="small"
                onClick={handleSaveData}
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Flex direction="column" gap={16}>
            <PageNavbar
              textIcon={<CartIcon />}
              text={__('Checkout', 'kirki-ecommerce')}
              handleBack={handleBackButton}
            />
            <Card type="large">
              <Flex style={{ alignItems: 'center' }}>
                <Text
                  header={__('Allow Guest Checkout', 'kirki-ecommerce')}
                  subHeader={__(
                    'Let customers buy without logging in or creating an account.',
                    'kirki-ecommerce',
                  )}
                  type="secondary"
                />
                <ActionGroup>
                  <ToggleButton
                    value={dataObj?.is_allowed_guest_checkout as boolean}
                    onChange={(value) =>
                      handleOnChange(value, 'is_allowed_guest_checkout')
                    }
                  />
                </ActionGroup>
              </Flex>
            </Card>
            <CheckoutConf
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
            />
            <LegalInfo
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
            />
          </Flex>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

export default CheckoutSettings;
