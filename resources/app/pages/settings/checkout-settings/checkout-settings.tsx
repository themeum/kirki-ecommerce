import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import SwitchField from '@/components/form/switch-field';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Text from '@/components/ui/text';
import { CartIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import CheckoutConf from '@/pages/settings/checkout-settings/checkout-conf';
import LegalInfo from '@/pages/settings/checkout-settings/legal-info';
import { useSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import SettingsPageHeader from '@/pages/settings/settings-page-header';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import {
  type CheckoutSettingsFormInput,
  type CheckoutSettingsFormPayload,
  CheckoutSettingsFormSchema,
} from '@/schemas/forms/checkout-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const CheckoutSettings = () => {
  const { data: checkoutSettingsData, isLoading } = useSettingsQuery('checkout');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation<'checkout'>();

  const loaded = !isLoading && Boolean(checkoutSettingsData);

  const form = useForm<CheckoutSettingsFormInput, unknown, CheckoutSettingsFormPayload>({
    resolver: zodResolver(CheckoutSettingsFormSchema),
    defaultValues: getDefaults(CheckoutSettingsFormSchema),
  });

  useEffect(() => {
    if (!checkoutSettingsData || !Object.keys(checkoutSettingsData).length) {
      return;
    }

    form.reset(pickFormValues(CheckoutSettingsFormSchema, checkoutSettingsData));
  }, [checkoutSettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(form.formState.isDirty);
  }, [form.formState.isDirty]);

  const handleSaveData = async (payload: CheckoutSettingsFormPayload) => {
    try {
      await saveSettings({
        key: 'checkout',
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
    isDirty: form.formState.isDirty,
    isSaving: isPending,
    onSave: form.handleSubmit(handleSaveData),
    onDiscard: handleDiscardData,
  });

  return (
    <Container size="sm">
      {loaded ? (
        <Form {...form}>
          <Flex direction="column" gap={4}>
            <SettingsPageHeader
              icon={<CartIcon />}
              title={__('Checkout', 'kirki-ecommerce')}
            />
            <Card cssOverride={cardStyles.formCard} >
              <CardContent >

                <Flex align="center">
                  <Flex direction="column" gap={2}>
                    <Text weight="medium">{__('Allow Guest Checkout', 'kirki-ecommerce')} <Badge>Work in progress</Badge></Text>
                    <Text variant="small" color="secondary">{__(
                      'Let customers buy without logging in or creating an account.',
                      'kirki-ecommerce',
                    )}</Text>
                  </Flex>
                  <ActionGroup>
                    {/* @TODO: disabled need to be removed in the future */}
                    <SwitchField name="is_allowed_guest_checkout" disabled />
                  </ActionGroup>
                </Flex>
              </CardContent>
            </Card>
            <CheckoutConf />
            <LegalInfo />
          </Flex>
        </Form>
      ) : (
        <div>{__('Loading ...', 'kirki-ecommerce')}</div>
      )}
    </Container>
  );
};

CheckoutSettings.displayName = 'CheckoutSettings';

export default CheckoutSettings;
