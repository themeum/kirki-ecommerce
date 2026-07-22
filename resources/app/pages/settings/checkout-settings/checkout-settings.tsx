import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useOutletContext } from 'react-router';

import SwitchField from '@/components/form/switch-field';
import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { CLASS_PREFIX } from '@/conf';
import { CartIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import ActionGroup from '@/components/ui/action-group';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import {
  CheckoutSettingsFormSchema,
  checkoutSettingsDefaultValues,
  type CheckoutSettingsFormValues,
} from '@/schemas/forms/checkout-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import CheckoutConf from '@/pages/settings/checkout-settings/checkout-conf';
import LegalInfo from '@/pages/settings/checkout-settings/legal-info';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

const CheckoutSettings = () => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const hasUnsavedData = useUnsavedStatus();
  const { data: checkoutSettingsData, isLoading } = useSettingsQuery('checkout');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(checkoutSettingsData);

  const form = useForm<CheckoutSettingsFormValues>({
    resolver: zodResolver(CheckoutSettingsFormSchema),
    defaultValues: checkoutSettingsDefaultValues,
  });

  useEffect(() => {
    if (!checkoutSettingsData || !Object.keys(checkoutSettingsData).length) {
      return;
    }

    const checkoutConfig =
      checkoutSettingsData.checkout_configuration || {};

    form.reset({
      ...checkoutSettingsDefaultValues,
      ...checkoutSettingsData,
      terms_and_conditions_content:
        checkoutSettingsData.terms_and_conditions_content ?? '',
      privacy_policy_content:
        checkoutSettingsData.privacy_policy_content ?? '',
      checkout_configuration: {
        ...checkoutSettingsDefaultValues.checkout_configuration,
        ...checkoutConfig,
      },
    });
  }, [checkoutSettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(form.formState.isDirty);
  }, [form.formState.isDirty]);

  const handleSaveData = async (values: CheckoutSettingsFormValues) => {
    try {
      await saveSettings({
        key: 'checkout',
        data: values as SettingsSectionData,
      });
      form.reset(values);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleDiscardData = () => {
    form.reset();
  };

  const handleBackButton = () => {
    if (form.formState.isDirty) {
      confirmAction({
        action: () => navigate('/settings'),
      });
      return;
    }
    navigate('/settings');
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
                size="sm"
                onClick={handleDiscardData}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={form.handleSubmit(handleSaveData)}
                loading={isPending}
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
            <Flex direction="column" gap={16}>
              <PageNavbar
                textIcon={<CartIcon />}
                text={__('Checkout', 'kirki-ecommerce')}
                handleBack={handleBackButton}
              />
              <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
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
                    <SwitchField name="is_allowed_guest_checkout" />
                  </ActionGroup>
                </Flex>
              </Card>
              <CheckoutConf />
              <LegalInfo />
            </Flex>
          </Form>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

CheckoutSettings.displayName = 'CheckoutSettings';

export default CheckoutSettings;
