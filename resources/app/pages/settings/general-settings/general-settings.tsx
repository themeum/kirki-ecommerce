import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { Form } from '@/components/ui/form';
import { HomeIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import {
  GeneralSettingsFormSchema,
  generalSettingsDefaultValues,
  type GeneralSettingsFormValues,
} from '@/schemas/forms/general-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { MediaRef, SettingsSectionData } from '@/types';
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
): GeneralSettingsFormValues => {
  const storeLogoValue = settings.store_logo;
  const storeLogoMedia =
    storeLogoValue && typeof storeLogoValue === 'object'
      ? (storeLogoValue as MediaRef)
      : null;
  const storeAddress = settings.store_address;

  return {
    store_name: settings.store_name ?? '',
    store_email: settings.store_email ?? '',
    store_logo:
      storeLogoMedia?.id ??
      (typeof storeLogoValue === 'number' || typeof storeLogoValue === 'string'
        ? storeLogoValue
        : null),
    store_phone: settings.store_phone ?? '',
    store_address: {
      address_line_1: storeAddress?.address_line_1 ?? '',
      address_line_2: storeAddress?.address_line_2 ?? '',
      city: storeAddress?.city ?? '',
      state_province:
        storeAddress?.state_province ?? storeAddress?.state ?? '',
      zip_code: storeAddress?.zip_code ?? storeAddress?.postal_code ?? '',
      country: storeAddress?.country ?? '',
    },
    selling_location_type: settings.selling_location_type ?? 'all-countries',
    selling_countries: settings.selling_countries ?? [],
    order_id_prefix: settings.order_id_prefix ?? '',
    order_id_suffix: settings.order_id_suffix ?? '',
    invoice_id_prefix: settings.invoice_id_prefix ?? '',
    invoice_id_sequence: settings.invoice_id_sequence ?? '',
    invoice_id_suffix: settings.invoice_id_suffix ?? '',
    invoice_counter_reset_schedule:
      settings.invoice_counter_reset_schedule ?? 'none',
  };
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
    useUpdateSettingsMutation();

  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(GeneralSettingsFormSchema),
    defaultValues: generalSettingsDefaultValues,
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

  const handleSaveData = async (values: GeneralSettingsFormValues) => {
    try {
      await saveSettings({
        key: 'general',
        data: values as SettingsSectionData,
      });
      form.reset(values);
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
                type="ghost"
                text={__('Cancel', 'kirki-ecommerce')}
                size="small"
                onClick={handleDiscardData}
                state={isSaving ? 'disabled' : undefined}
              />
              <Button
                type="primary"
                text={__('Save', 'kirki-ecommerce')}
                size="small"
                onClick={form.handleSubmit(handleSaveData)}
                state={isSaving ? 'loading' : undefined}
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={16}>
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
