import { zodResolver } from '@hookform/resolvers/zod';
import { Home } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import CalculateTax from '@/features/settings/general/pages/calculate-tax';
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
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import type { GeneralSettings as GeneralSettingsData } from '@/schemas/catalog/settings';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const mapSettingsToFormValues = (settings: GeneralSettingsData): GeneralSettingsFormInput => {
  const storeAddress = settings.store_address;
  const orderNumber = settings.order_number;
  const invoiceNumber = settings.invoice_number;

  return pickFormValues(GeneralSettingsFormSchema, settings, {
    store_address: {
      address_line_1: storeAddress?.address_line_1 ?? '',
      address_line_2: storeAddress?.address_line_2 ?? '',
      city: storeAddress?.city ?? '',
      state: storeAddress?.state ?? storeAddress?.state ?? '',
      postal_code: storeAddress?.postal_code ?? storeAddress?.postal_code ?? '',
      country: storeAddress?.country ?? '',
    },
    order_number: {
      prefix: orderNumber?.prefix ?? '',
      suffix: orderNumber?.suffix ?? '',
    },
    invoice_number: {
      prefix: invoiceNumber?.prefix ?? '',
      sequence: invoiceNumber?.sequence ?? '000001',
      suffix: invoiceNumber?.suffix ?? '',
      apply_year_prefix: invoiceNumber?.apply_year_prefix ?? false,
      reset_sequence_every_year: invoiceNumber?.reset_sequence_every_year ?? false,
    },
  });
};

const GeneralSettings = () => {
  const { data: generalSettingsData, isLoading } = useSettingsQuery('general');
  const { mutateAsync: saveSettings, isPending: isSaving } = useUpdateSettingsMutation<'general'>();

  const form = useForm<GeneralSettingsFormInput, unknown, GeneralSettingsFormPayload>({
    resolver: zodResolver(GeneralSettingsFormSchema),
    defaultValues: getDefaults(GeneralSettingsFormSchema),
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (!generalSettingsData || !Object.keys(generalSettingsData).length) {
      return;
    }

    form.reset(mapSettingsToFormValues(generalSettingsData));
  }, [generalSettingsData, form]);

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

  return !isLoading ? (
    <div css={scoped({ width: '100%' })}>
      <Form {...form}>
        <Flex direction="column" gap={4}>
          <SettingsPageHeader icon={<Home size={16} />} title={__('General', 'kirki-ecommerce')} />
          <StoreContactDetails />
          <StoreAddressDetails />
          <SellingLocation />
          <OrderId />
          <InvoiceId />
          <CalculateTax />
        </Flex>
      </Form>
    </div>
  ) : (
    <GeneralSettingsSkeleton />
  );
};

GeneralSettings.displayName = 'GeneralSettings';

export default GeneralSettings;
