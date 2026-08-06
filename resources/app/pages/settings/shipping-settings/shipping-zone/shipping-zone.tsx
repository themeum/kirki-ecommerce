import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import RegionsField from '@/components/form/regions-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import {
  ShippingZoneFormSchema,
  type ShippingZoneFormInput,
  type ShippingZoneFormPayload,
} from '@/schemas/forms/shipping-zone-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import { useSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import SettingsPageHeader from '@/pages/settings/settings-page-header';
import { ShippingMethod } from '@/pages/settings/shipping-settings/shipping-method/shipping-method';
import type { ShippingMethodData, ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { setUnsavedDataStatus } from '@/pages/settings/utils';

const ShippingZonePage = () => {
  const navigate = useNavigate();

  const { zone_Id } = useParams();
  const zoneId = zone_Id;

  const [shippingZonesObj, setShippingZonesObj] = useState<ShippingZone[]>([]);

  const { data: shippingSettingsData, isLoading } = useSettingsQuery('shipping');
  const { mutateAsync: saveSettings, isPending: isSaving } = useUpdateSettingsMutation<'shipping'>();

  const loaded = !isLoading && Boolean(shippingSettingsData);
  const zones = (shippingSettingsData?.shipping_zones as ShippingZone[]) || [];

  const activeZone = zones.find((zone) => String(zone.id) === String(zoneId));

  const form = useForm<ShippingZoneFormInput, unknown, ShippingZoneFormPayload>({
    resolver: zodResolver(ShippingZoneFormSchema),
    defaultValues: getDefaults(ShippingZoneFormSchema),
  });

  const { isDirty } = form.formState;

  const shippingMethodList = useMemo(() => {
    return shippingZonesObj.reduce<
      Record<string | number, ShippingMethodData[]>
    >((acc, zone) => {
      acc[zone.id] = (zone.shipping_methods || []).map((method) => ({
        ...method,
        zoneId: zone.id,
      }));
      return acc;
    }, {});
  }, [shippingZonesObj]);

  useEffect(() => {
    if (!zones.length) {
      return;
    }
    setShippingZonesObj(zones);
  }, [zones]);

  useEffect(() => {
    if (!activeZone) {
      return;
    }
    form.reset(pickFormValues(ShippingZoneFormSchema, activeZone));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-hydrate only when the active zone identity changes, not on every unrelated zones update
  }, [activeZone?.id]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const handleSaveZone = async (payload: ShippingZoneFormPayload) => {
    const updatedZones = shippingZonesObj.map((zone) =>
      String(zone.id) === String(zoneId)
        ? { ...zone, title: payload.title, regions: payload.regions }
        : zone,
    );

    try {
      await saveSettings({
        key: 'shipping',
        data: { shipping_zones: updatedZones },
      });
      setShippingZonesObj(updatedZones);
      form.reset(payload);
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
    onSave: form.handleSubmit(handleSaveZone),
    onDiscard: handleDiscardData,
  });

  return (
    <>
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <SettingsPageHeader
                title={__('Set Zone Details', 'kirki-ecommerce')}
                onBack={() => navigate('/settings/shipping')}
              />
              <Card cssOverride={cardStyles.formCard}>
                <CardContent>
                  <Flex direction="column" gap={4}>
                    <TextField
                      name="title"
                      label={__('Title', 'kirki-ecommerce')}
                      placeholder={__('Zone 2- South Asia', 'kirki-ecommerce')}
                    />
                    <RegionsField name="regions" label={__('Regions', 'kirki-ecommerce')} />
                  </Flex>
                </CardContent>
              </Card>

              <ShippingMethod
                shippingSettingsData={shippingSettingsData}
                shippingMethodList={
                  activeZone
                    ? shippingMethodList[activeZone.id] || []
                    : []
                }
                shippingZonesObj={shippingZonesObj}
                setShippingZonesObj={setShippingZonesObj}
                zoneId={zoneId}
              />
            </Flex>
          </Form>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

ShippingZonePage.displayName = 'ShippingZone';

export default ShippingZonePage;
