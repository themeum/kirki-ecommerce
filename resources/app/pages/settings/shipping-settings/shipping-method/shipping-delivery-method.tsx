import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router';
import { toast } from 'sonner';

import { TruckIcon, WeightIcon, StoreIcon } from '@/icons';
import PageHeading from '@/molecules/page-heading';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Card from '@/molecules/card';
import { Select } from '@/molecules/select';
import PageNavbar from '@/components/page-navbar';
import { queryClient } from '@/libs/query-client';
import { queryKeys } from '@/libs/query-keys';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { getErrorMessage } from '@/services/helpers';
import { useSettingsQuery, updateSettings } from '@/services/settings';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import FlatRateSettings from '@/pages/settings/shipping-settings/shipping-method/flat-rate-settings';
import LocalPickupSettings from '@/pages/settings/shipping-settings/shipping-method/local-pickup-settings';
import RateByWeightSettings from '@/pages/settings/shipping-settings/shipping-method/rate-by-weight-settings';
import { ShippingRules } from '@/pages/settings/shipping-settings/shipping-method/shipping-rules/shipping-rules';
import { METHOD_SCHEMAS, type ShippingMethodData, type ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { checkUnsavedDataStatus, setUnsavedDataStatus } from '@/pages/settings/utils';

type SettingsOutletContext = {
  confirmAction: (opts: {
    action: () => void;
    otherProps?: Record<string, unknown>;
  }) => void;
};

type MethodType = 'flat_rate' | 'local_pickup' | 'weight';

type MethodSettingsEntry = {
  title: string;
  comp: ReactNode;
};

const ShippingDeliveryMethod = () => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const [searchParams] = useSearchParams();

  const hasUnsavedData = useUnsavedStatus();
  const { data: shippingSettingsData } = useSettingsQuery('shipping');
  const method_Id = searchParams.get('methodId');
  const zoneIdFromURL = searchParams.get('zoneId');

  const final_zoneId = zoneIdFromURL;
  const [methodId] = useState(method_Id || crypto.randomUUID());

  const [methodType, setMethodType] = useState<MethodType>('flat_rate');
  const [dataObj, setDataObj] = useState<Record<string, unknown>>({});
  const [initialDataObj, setInitialDataObj] = useState<Record<string, unknown>>(
    {},
  );

  const shippingZones = (shippingSettingsData?.shipping_zones as
    | ShippingZone[]
    | undefined) ?? [];

  const editingMethod = shippingZones
    .flatMap((zone) => zone?.shipping_methods || [])
    .find((method) => method?.id === method_Id);

  const methodExist = useMemo(() => {
    return shippingZones.some((zone) =>
      zone.shipping_methods?.some((m) => m.id === methodId),
    );
  }, [shippingZones, methodId]);

  useEffect(() => {
    if (!editingMethod) {
      return;
    }
    setMethodType(editingMethod.type as MethodType);
    setDataObj({
      name: editingMethod.name || '',
      is_enabled: editingMethod.is_enabled ?? true,
      ...sanitizeByMethodType(editingMethod.type, editingMethod),
    });
    setInitialDataObj({
      name: editingMethod.name || '',
      type: editingMethod.type,
      is_enabled: editingMethod.is_enabled ?? true,
      ...sanitizeByMethodType(editingMethod.type, editingMethod),
    });
  }, [editingMethod]);

  const buildMethodData = (
    type: string,
    prev: Record<string, unknown> = {},
  ): Record<string, unknown> => {
    return {
      name: (prev.name as string) || '',
      is_enabled: (prev.is_enabled as boolean | undefined) ?? true,
      ...sanitizeByMethodType(type, prev),
    };
  };

  const sanitizeByMethodType = (
    type: string,
    data: Record<string, unknown> | ShippingMethodData = {},
  ): Record<string, unknown> => {
    const schema = METHOD_SCHEMAS[type] || {};
    const source = data as Record<string, unknown>;

    return Object.keys(schema).reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = source[key] ?? schema[key];
      return acc;
    }, {});
  };

  useEffect(() => {
    setDataObj((prev) => buildMethodData(methodType, prev));
    setInitialDataObj((prev) => buildMethodData(methodType, prev));
  }, [methodType]);

  const handleOnChange = (value: unknown, key: string) => {
    setUnsavedDataStatus(true);
    setDataObj((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const methodSettingsMap: Record<MethodType, MethodSettingsEntry> = {
    flat_rate: {
      title: __('Flat Rate', 'kirki-ecommerce'),
      comp: (
        <FlatRateSettings handleOnChange={handleOnChange} dataObj={dataObj} />
      ),
    },
    local_pickup: {
      title: __('Local Pickup', 'kirki-ecommerce'),
      comp: (
        <LocalPickupSettings
          handleOnChange={handleOnChange}
          dataObj={dataObj}
        />
      ),
    },
    weight: {
      title: __('Rate by Weight', 'kirki-ecommerce'),
      comp: (
        <RateByWeightSettings
          handleOnChange={handleOnChange}
          dataObj={dataObj}
        />
      ),
    },
  };

  const handleCreateOrUpdateData = async () => {
    const shippingMethod: ShippingMethodData = {
      id: methodId,
      type: methodType,
      name: dataObj.name as string,
      is_enabled: dataObj.is_enabled as boolean,
      ...sanitizeByMethodType(methodType, dataObj),
      shipping_rules: editingMethod?.shipping_rules ?? [],
    };

    const updatedShippingZones = shippingZones.map((zone) => {
      if (methodExist) {
        return {
          ...zone,
          shipping_methods: zone.shipping_methods.map((m) =>
            m.id === shippingMethod.id ? shippingMethod : m,
          ),
        };
      }

      if (!editingMethod && String(zone.id) === String(final_zoneId)) {
        return {
          ...zone,
          shipping_methods: [...(zone.shipping_methods || []), shippingMethod],
        };
      }

      return zone;
    });

    const updatedData: SettingsSectionData = {
      ...(shippingSettingsData || {}),
      shipping_zones: updatedShippingZones,
    };

    try {
      await updateSettings({ key: 'shipping', data: updatedData });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Settings('shipping'),
      });
      setUnsavedDataStatus(false);
      toast.success(
        methodExist
          ? __('Shipping method updated', 'kirki-ecommerce')
          : __('New shipping method created', 'kirki-ecommerce'),
      );
      navigate(
        `/settings/shipping/delivery-method?methodId=${methodId}&zoneId=${final_zoneId}`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleBackButton = () => {
    checkUnsavedDataStatus({
      initialDataObj,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate(`/settings/shipping/zone/${final_zoneId}`),
        }),
      onClean: () => {
        navigate(`/settings/shipping/zone/${final_zoneId}`);
      },
    });
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
              />
              <Button
                type="primary"
                text={__('Save', 'kirki-ecommerce')}
                onClick={handleCreateOrUpdateData}
                size="small"
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        <Flex direction="column" gap={16}>
          <PageNavbar
            text={methodSettingsMap[methodType].title ?? ''}
            handleBack={handleBackButton}
          />
          <Card
            type="large"
            style={{
              gap: 'var(--decom-spacing-4)',
            }}
          >
            <Input
              value={(dataObj?.name as string) || ''}
              placeholder={__('Standard Delivery', 'kirki-ecommerce')}
              onChange={(value) => handleOnChange(value, 'name')}
              label={__('Method Name', 'kirki-ecommerce')}
            />
            <Select
              label={__('Method Type', 'kirki-ecommerce')}
              placeholder={__('Flat Rate', 'kirki-ecommerce')}
              optionsArray={[
                {
                  title: __('Flat Rate', 'kirki-ecommerce'),
                  value: 'flat_rate',
                  leftIcon: <TruckIcon />,
                },
                {
                  title: __('Local Pickup', 'kirki-ecommerce'),
                  value: 'local_pickup',
                  leftIcon: <WeightIcon />,
                },
                {
                  title: __('Rate by Weight', 'kirki-ecommerce'),
                  value: 'weight',
                  leftIcon: <StoreIcon />,
                },
              ]}
              value={methodType}
              onChange={(value) => {
                if (typeof value === 'string') {
                  setMethodType(value as MethodType);
                }
              }}
            />

            {methodSettingsMap[methodType].comp}
          </Card>
          {methodExist && <ShippingRules methodId={methodId} />}
        </Flex>
      </Container>
    </>
  );
};

ShippingDeliveryMethod.displayName = 'ShippingDeliveryMethod';

export default ShippingDeliveryMethod;
