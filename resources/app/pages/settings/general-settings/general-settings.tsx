import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { HomeIcon } from '@/icons';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getSettingsAPI,
  updateSettings,
  updateSettingsAPI,
} from '@/store/settingsSlice';
import { getErrorsObject } from '@/store/utils';
import type {
  FormErrors,
  MediaChangePayload,
  MediaRef,
  SettingsSectionData,
} from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import { dispatchToastMessage } from '../../utils';
import { checkUnsavedDataStatus, setUnsavedDataStatus } from '../utils';
import InvoiceId from './invoice-id';
import OrderId from './order-id';
import SellingLocation from './selling-location';
import StoreAddressDetails from './store-address-details';
import StoreContactDetails from './store-contact-details';
import type { GeneralSettingsFormData } from './utils';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

const GeneralSettings = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const [storeLogo, setStoreLogo] = useState('');
  const [sellingLocation, setSellingLocation] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [dataObj, setDataObj] = useState<GeneralSettingsFormData | null>(null);
  const [initialData, setInitialData] = useState<GeneralSettingsFormData>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const hasUnsavedData = useAppSelector((state) => state.unsaved.hasUnsavedData);
  const { loaded, data: generalSettingsData } = useAppSelector(
    (state) => state.settings?.general,
  );

  useEffect(() => {
    dispatch(getSettingsAPI('general'));
  }, []);

  useEffect(() => {
    if (Object.keys(generalSettingsData || {}).length) {
      const storeLogoValue = generalSettingsData?.store_logo;
      const storeLogoMedia =
        storeLogoValue && typeof storeLogoValue === 'object'
          ? (storeLogoValue as MediaRef)
          : null;

      setDataObj({
        ...generalSettingsData,
        store_logo: storeLogoMedia?.id ?? null,
      } as GeneralSettingsFormData);
      setInitialData({
        ...generalSettingsData,
        store_logo: storeLogoMedia?.url ?? null,
      } as GeneralSettingsFormData);
      setStoreLogo(storeLogoMedia?.url || '');
      setSelectedCountries(
        (generalSettingsData?.selling_countries as string[]) || [],
      );
      setSellingLocation(
        (generalSettingsData?.selling_location_type as string) || '',
      );
    }
  }, [generalSettingsData]);

  const handleResetIDField = (key: string) => {
    if (key === 'order') {
      setDataObj((prev) => ({
        ...prev,
        order_id_prefix: '',
        order_id_suffix: '',
      }));
    } else {
      setDataObj((prev) => ({
        ...prev,
        invoice_id_prefix: '',
        invoice_id_sequence: '',
        invoice_id_suffix: '',
      }));
    }
  };

  const handleOnChange = (value: unknown, key: string) => {
    const addressKeys = [
      'address_line_1',
      'address_line_2',
      'city',
      'state_province',
      'zip_code',
      'country',
    ];

    setUnsavedDataStatus(true);

    setDataObj((prev) => {
      if (addressKeys.includes(key)) {
        return {
          ...prev,
          store_address: {
            ...prev?.store_address,
            [key]: value,
          },
        };
      }
      if (key === 'selling_location_type') {
        setSellingLocation(value as string);
        if (value === 'all-countries') {
          setSelectedCountries([]);
        }
      }
      if (key === 'selling_countries') {
        return {
          ...prev,
          selling_countries: value as string[],
        };
      }
      if (key === 'store_logo') {
        const media = value as MediaChangePayload;
        setStoreLogo(media?.url || '');
        return {
          ...prev,
          [key]: media?.id,
        };
      }
      return {
        ...prev,
        [key]: value,
      };
    });

    setErrors((prev) => ({
      ...prev,
      ['data.' + key]: null,
    }));
  };

  const handleSaveData = async () => {
    const updatedData: GeneralSettingsFormData = {
      ...dataObj,
      selling_countries: selectedCountries,
    };

    setDataObj(updatedData);
    const result = await updateSettingsAPI('general', updatedData);
    if (isApiSuccess(result)) {
      dispatch(
        updateSettings({
          key: 'general',
          value: result.data as SettingsSectionData,
        }),
      );
      setUnsavedDataStatus(false);
      dispatchToastMessage('success', {
        title: __('General settings updated', 'kirki-ecommerce'),
      });
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
    }
  };

  const handleBackButton = () => {
    checkUnsavedDataStatus({
      initialDataObj: initialData,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate(`/settings`),
        }),
      onClean: () => {
        navigate(`/settings`);
      },
    });
  };

  const handleDiscardData = () => {
    setDataObj(initialData);
    setStoreLogo((initialData?.store_logo as string) || '');
    setSelectedCountries(initialData?.selling_countries || []);
    setSellingLocation(initialData?.selling_location_type || '');
    setUnsavedDataStatus(false);
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
                onClick={() => handleDiscardData()}
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
              textIcon={<HomeIcon />}
              text={__('General', 'kirki-ecommerce')}
              handleBack={handleBackButton}
            />

            <StoreContactDetails
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
              storeLogo={storeLogo}
            />

            <StoreAddressDetails
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
            />

            <SellingLocation
              handleOnChange={handleOnChange}
              errors={errors}
              setErrors={setErrors}
              sellingLocation={sellingLocation}
              setSellingLocation={setSellingLocation}
              selectedCountries={selectedCountries}
              setSelectedCountries={setSelectedCountries}
            />

            <OrderId
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              handleResetIDField={handleResetIDField}
              errors={errors}
            />

            <InvoiceId
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              handleResetIDField={handleResetIDField}
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

export default GeneralSettings;
