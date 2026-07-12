import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { HomeIcon } from '@/icons';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { getErrorsObject } from '@/libs/api';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type {
  FormErrors,
  MediaChangePayload,
  MediaRef,
  SettingsSectionData,
} from '@/types';
import { __ } from '@/wpi18n';

import { checkUnsavedDataStatus, setUnsavedDataStatus } from '@/pages/settings/utils';
import InvoiceId from '@/pages/settings/general-settings/invoice-id';
import OrderId from '@/pages/settings/general-settings/order-id';
import SellingLocation from '@/pages/settings/general-settings/selling-location';
import StoreAddressDetails from '@/pages/settings/general-settings/store-address-details';
import StoreContactDetails from '@/pages/settings/general-settings/store-contact-details';
import type { GeneralSettingsFormData } from '@/pages/settings/general-settings/utils';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

const GeneralSettings = () => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const [storeLogo, setStoreLogo] = useState('');
  const [sellingLocation, setSellingLocation] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [dataObj, setDataObj] = useState<GeneralSettingsFormData | null>(null);
  const [initialData, setInitialData] = useState<GeneralSettingsFormData>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const hasUnsavedData = useUnsavedStatus();
  const { data: generalSettingsData, isLoading } = useSettingsQuery('general');
  const { mutate: saveSettings } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(generalSettingsData);

  useEffect(() => {
    if (!generalSettingsData || !Object.keys(generalSettingsData).length) {
      return;
    }
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

  const handleSaveData = () => {
    const updatedData: GeneralSettingsFormData = {
      ...dataObj,
      selling_countries: selectedCountries,
    };

    setDataObj(updatedData);
    saveSettings(
      { key: 'general', data: updatedData as SettingsSectionData },
      {
        onSuccess: () => setUnsavedDataStatus(false),
        onError: (error) => {
          const errObj = error as { errors?: Record<string, string[]> };
          setErrors(getErrorsObject(errObj.errors));
        },
      },
    );
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

GeneralSettings.displayName = 'GeneralSettings';

export default GeneralSettings;
