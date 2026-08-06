import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { HomeIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import type { GeneralSettings as GeneralSettingsData } from '@/schemas/catalog/settings';
import {
  GeneralSettingsFormSchema,
  type GeneralSettingsFormInput,
  type GeneralSettingsFormPayload,
} from '@/schemas/forms/general-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { __ } from '@/wpi18n';

import InvoiceId from '@/pages/settings/general-settings/invoice-id';
import OrderId from '@/pages/settings/general-settings/order-id';
import SellingLocation from '@/pages/settings/general-settings/selling-location';
import StoreAddressDetails from '@/pages/settings/general-settings/store-address-details';
import StoreContactDetails from '@/pages/settings/general-settings/store-contact-details';
import { useSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import SettingsPageHeader from '@/pages/settings/settings-page-header';
import { setUnsavedDataStatus } from '@/pages/settings/utils';

const mapSettingsToFormValues = (
  settings: GeneralSettingsData,
): GeneralSettingsFormInput => {
  const storeAddress = settings.store_address;

  return pickFormValues(GeneralSettingsFormSchema, settings, {
    store_address: {
      address_line_1: storeAddress?.address_line_1 ?? '',
      address_line_2: storeAddress?.address_line_2 ?? '',
      city: storeAddress?.city ?? '',
      state:
        storeAddress?.state ?? storeAddress?.state ?? '',
      postal_code: storeAddress?.postal_code ?? storeAddress?.postal_code ?? '',
      country: storeAddress?.country ?? '',
    },
  });
};

const getStoreLogoUrl = (settings?: GeneralSettingsData | null) => {
  if (!settings?.store_logo || typeof settings.store_logo !== 'object') {
    return null;
  }
  return settings.store_logo.url || null;
};

const GeneralSettings = () => {
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);
  const savedLogoUrlRef = useRef<string | null>(null);

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

  const handleDiscardData = () => {
    form.reset();
    setStoreLogoUrl(savedLogoUrlRef.current);
  };

  useSettingsPageActions({
    isDirty,
    isSaving,
    onSave: form.handleSubmit(handleSaveData),
    onDiscard: handleDiscardData,
  });

  return (
    <Container size="sm">
      {loaded ? (
        <Form {...form}>
          <Flex direction="column" gap={4}>
            <SettingsPageHeader
              icon={<HomeIcon />}
              title={__('General', 'kirki-ecommerce')}
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
  );
};

GeneralSettings.displayName = 'GeneralSettings';

export default GeneralSettings;
