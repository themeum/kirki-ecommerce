import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { HomeIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { getDefaults, pickFormValues } from '@/libs/zod';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import {
  GeneralSettingsFormSchema,
  type GeneralSettingsFormInput,
  type GeneralSettingsFormPayload,
} from '@/schemas/forms/general-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import InvoiceId from '@/pages/settings/general-settings/invoice-id';
import OrderId from '@/pages/settings/general-settings/order-id';
import SellingLocation from '@/pages/settings/general-settings/selling-location';
import StoreAddressDetails from '@/pages/settings/general-settings/store-address-details';
import StoreContactDetails from '@/pages/settings/general-settings/store-contact-details';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

const mapSettingsToFormValues = (
  settings: SettingsSectionData,
): GeneralSettingsFormInput => {
  const storeAddress = settings.store_address;

  return pickFormValues(GeneralSettingsFormSchema, settings, {
    store_address: {
      address_line_1: storeAddress?.address_line_1 ?? '',
      address_line_2: storeAddress?.address_line_2 ?? '',
      city: storeAddress?.city ?? '',
      state_province:
        storeAddress?.state_province ?? storeAddress?.state ?? '',
      zip_code: storeAddress?.zip_code ?? storeAddress?.postal_code ?? '',
      country: storeAddress?.country ?? '',
    },
  });
};

const getStoreLogoUrl = (settings?: SettingsSectionData | null) => {
  if (!settings?.store_logo || typeof settings.store_logo !== 'object') {
    return null;
  }
  return settings.store_logo.url || null;
};

const GeneralSettings = () => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);
  const savedLogoUrlRef = useRef<string | null>(null);

  const hasUnsavedData = useUnsavedStatus();
  const { data: generalSettingsData, isLoading } = useSettingsQuery('general');
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation<'general'>();

  const form = useForm<GeneralSettingsFormInput, unknown, GeneralSettingsFormPayload>({
    resolver: zodResolver(GeneralSettingsFormSchema),
    defaultValues: getDefaults(GeneralSettingsFormSchema),
  });

  const { isDirty } = form.formState;
  const loaded = !isLoading && Boolean(generalSettingsData);

  useEffect(() => {
    if (!generalSettingsData || !Object.keys(generalSettingsData).length) {
      return;
    }

    const logoUrl = getStoreLogoUrl(generalSettingsData);
    form.reset(mapSettingsToFormValues(generalSettingsData));
    setStoreLogoUrl(logoUrl);
    savedLogoUrlRef.current = logoUrl;
  }, [generalSettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const handleSaveData = async (payload: GeneralSettingsFormPayload) => {
    try {
      await saveSettings({
        key: 'general',
        data: payload,
      });
      form.reset(form.getValues());
      savedLogoUrlRef.current = storeLogoUrl;
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleBackButton = () => {
    if (isDirty) {
      confirmAction({
        action: () => navigate(`/settings`),
      });
      return;
    }
    navigate(`/settings`);
  };

  const handleDiscardData = () => {
    form.reset();
    setStoreLogoUrl(savedLogoUrlRef.current);
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
                variant="ghost"
                onClick={handleDiscardData}
                disabled={isSaving}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={form.handleSubmit(handleSaveData)}
                loading={isSaving}
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <PageNavbar
                textIcon={<HomeIcon />}
                text={__('General', 'kirki-ecommerce')}
                handleBack={handleBackButton}
              />

              <StoreContactDetails
                storeLogoUrl={storeLogoUrl}
                onStoreLogoPreviewChange={setStoreLogoUrl}
              />
              <StoreAddressDetails />
              <SellingLocation />
              <OrderId />
              <InvoiceId />
            </Flex>
          </Form>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

GeneralSettings.displayName = 'GeneralSettings';

export default GeneralSettings;
