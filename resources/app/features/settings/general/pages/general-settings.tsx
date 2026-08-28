import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import InvoiceId from '@/features/settings/general/pages/invoice-id';
import OrderId from '@/features/settings/general/pages/order-id';
import SellingLocation from '@/features/settings/general/pages/selling-location';
import StoreAddressDetails from '@/features/settings/general/pages/store-address-details';
import StoreContactDetails from '@/features/settings/general/pages/store-contact-details';
import {
  type GeneralSettingsFormInput,
  type GeneralSettingsFormPayload,
  GeneralSettingsFormSchema,
} from '@/features/settings/general/schemas/forms/general-settings-form';
import GeneralSettingsSkeleton from '@/features/settings/general/skeletons/general-settings-skeleton';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { HomeIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import type { GeneralSettings as GeneralSettingsData } from '@/schemas/catalog/settings';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { __ } from '@/wpi18n';

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

const GeneralSettings = () => {
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

    form.reset(mapSettingsToFormValues(generalSettingsData));
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
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleDiscardData = () => {
    form.reset();
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

            <StoreContactDetails />
            <StoreAddressDetails />
            <SellingLocation />
            <OrderId />
            <InvoiceId />
          </Flex>
        </Form>
      ) : (
        <GeneralSettingsSkeleton />
      )}
    </Container>
  );
};

GeneralSettings.displayName = 'GeneralSettings';

export default GeneralSettings;
