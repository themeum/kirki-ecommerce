import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useOutletContext } from 'react-router';

import SwitchField from '@/components/form/switch-field';
import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { CartIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import ActionGroup from '@/components/ui/action-group';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import { getDefaults, pickFormValues } from '@/libs/zod';
import {
  CheckoutSettingsFormSchema,
  type CheckoutSettingsFormInput,
  type CheckoutSettingsFormPayload,
} from '@/schemas/forms/checkout-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { __ } from '@/wpi18n';

import { cardStyles } from '@/theme/card-styles';

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
                onClick={handleDiscardData}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
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
            <Flex direction="column" gap={4}>
              <PageNavbar
                textIcon={<CartIcon />}
                text={__('Checkout', 'kirki-ecommerce')}
                handleBack={handleBackButton}
              />
              <Card cssOverride={cardStyles.largeCard} >
                <CardContent cssOverride={cardStyles.largeContentPadded}>

                <Flex align="center">
                <Flex direction="column" gap={2}>
                  <Text weight="medium">{__('Allow Guest Checkout', 'kirki-ecommerce')}</Text>
                  <Text variant="small" color="secondary">{__(
                'Let customers buy without logging in or creating an account.',
                'kirki-ecommerce',
                )}</Text>
                </Flex>
                <ActionGroup>
                <SwitchField name="is_allowed_guest_checkout" />
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
    </>
  );
};

CheckoutSettings.displayName = 'CheckoutSettings';

export default CheckoutSettings;
