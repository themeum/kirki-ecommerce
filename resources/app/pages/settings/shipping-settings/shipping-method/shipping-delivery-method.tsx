import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { RouteConfig } from '@/config/route-config';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { queryClient } from '@/libs/query-client';
import { settingsKeys } from '@/libs/query-keys';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import SettingsPageHeader from '@/pages/settings/settings-page-header';
import FlatRateSettings from '@/pages/settings/shipping-settings/shipping-method/flat-rate-settings';
import LocalPickupSettings from '@/pages/settings/shipping-settings/shipping-method/local-pickup-settings';
import RateByWeightSettings from '@/pages/settings/shipping-settings/shipping-method/rate-by-weight-settings';
import { ShippingRules } from '@/pages/settings/shipping-settings/shipping-method/shipping-rules/shipping-rules';
import type { ShippingMethodData, ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import {
  type ShippingMethodFormInput,
  type ShippingMethodFormPayload,
  ShippingMethodFormSchema,
} from '@/schemas/forms/shipping-method-form';
import { updateSettings, useSettingsQuery } from '@/services/settings';
import { cardStyles } from '@/theme/card-styles';
import { uuid } from '@/utils';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const ShippingRoutes = RouteConfig.Settings.get('ShippingSettings');

const methodTypeOptions = [
  { label: __('Flat Rate', 'kirki-ecommerce'), value: 'flat_rate' },
  { label: __('Local Pickup', 'kirki-ecommerce'), value: 'local_pickup' },
  { label: __('Rate by Weight', 'kirki-ecommerce'), value: 'weight' },
];

const methodTypeTitles: Record<string, string> = {
  flat_rate: __('Flat Rate', 'kirki-ecommerce'),
  local_pickup: __('Local Pickup', 'kirki-ecommerce'),
  weight: __('Rate by Weight', 'kirki-ecommerce'),
};

const methodSettingsByType: Record<string, ReactNode> = {
  flat_rate: <FlatRateSettings />,
  local_pickup: <LocalPickupSettings />,
  weight: <RateByWeightSettings />,
};

const ShippingDeliveryMethod = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const methodIdParam = searchParams.get('methodId');
  const zoneIdParam = searchParams.get('zoneId');

  const methodId = useMemo(() => methodIdParam || uuid(), [methodIdParam]);

  const { data: shippingSettingsData } = useSettingsQuery('shipping');
  const shippingZones = (shippingSettingsData?.shipping_zones as ShippingZone[] | undefined) ?? [];

  const editingMethod = shippingZones
    .flatMap((zone) => zone.shipping_methods || [])
    .find((method) => method.id === methodIdParam);

  const methodExists = shippingZones.some((zone) =>
    zone.shipping_methods?.some((method) => method.id === methodId),
  );

  const form = useForm<ShippingMethodFormInput, unknown, ShippingMethodFormPayload>({
    resolver: zodResolver(ShippingMethodFormSchema),
    defaultValues: getDefaults(ShippingMethodFormSchema),
  });

  const { isDirty } = form.formState;
  const methodType = useWatch({ control: form.control, name: 'type' }) ?? 'flat_rate';

  useEffect(() => {
    if (!editingMethod) {
      return;
    }
    form.reset(pickFormValues(ShippingMethodFormSchema, editingMethod));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the method id so the form only reloads when a different method is opened; depending on the whole object would discard edits on every keystroke upstream
  }, [editingMethod?.id]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const handleSave = async (payload: ShippingMethodFormPayload) => {
    const shippingMethod: ShippingMethodData = {
      ...payload,
      id: methodId,
      is_enabled: editingMethod?.is_enabled ?? true,
      shipping_rules: editingMethod?.shipping_rules ?? [],
    };

    const updatedShippingZones = shippingZones.map((zone) => {
      if (methodExists) {
        return {
          ...zone,
          shipping_methods: zone.shipping_methods.map((method) =>
            method.id === shippingMethod.id ? shippingMethod : method,
          ),
        };
      }

      if (!editingMethod && String(zone.id) === String(zoneIdParam)) {
        return {
          ...zone,
          shipping_methods: [...(zone.shipping_methods || []), shippingMethod],
        };
      }

      return zone;
    });

    try {
      await updateSettings({
        key: 'shipping',
        data: { shipping_zones: updatedShippingZones },
      });
      void queryClient.invalidateQueries({
        queryKey: settingsKeys.section('shipping'),
      });
      toast.success(
        methodExists
          ? __('Shipping method updated', 'kirki-ecommerce')
          : __('New shipping method created', 'kirki-ecommerce'),
      );
      form.reset(payload);
      void navigate(
        `${ShippingRoutes.get('ShippingDeliveryMethod').buildLink()}?methodId=${methodId}&zoneId=${zoneIdParam}`,
      );
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleDiscardData = () => {
    form.reset();
  };

  useSettingsPageActions({
    isDirty,
    onSave: form.handleSubmit(handleSave),
    onDiscard: handleDiscardData,
  });

  return (
    <Container size="sm">
      <Form {...form}>
        <Flex direction="column" gap={4}>
          <SettingsPageHeader
            title={methodTypeTitles[methodType] ?? ''}
            onBack={() =>
              navigate(
                isDefined(zoneIdParam)
                  ? ShippingRoutes.get('ShippingZone').buildLink({ zone_Id: zoneIdParam })
                  : ShippingRoutes.buildLink(),
              )
            }
          />
          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <Flex direction="column" gap={4}>
                <TextField
                  name="name"
                  label={__('Method Name', 'kirki-ecommerce')}
                  placeholder={__('Standard Delivery', 'kirki-ecommerce')}
                />
                <SelectField
                  name="type"
                  label={__('Method Type', 'kirki-ecommerce')}
                  options={methodTypeOptions}
                />
                {methodSettingsByType[methodType]}
              </Flex>
            </CardContent>
          </Card>
          {methodExists && <ShippingRules methodId={methodId} />}
        </Flex>
      </Form>
    </Container>
  );
};

ShippingDeliveryMethod.displayName = 'ShippingDeliveryMethod';

export default ShippingDeliveryMethod;
