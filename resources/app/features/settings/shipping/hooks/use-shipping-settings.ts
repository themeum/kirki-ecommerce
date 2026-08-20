import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router';

import { RouteConfig } from '@/config/route-config';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import { getShippingMethodData as getZoneShippingMethods, removeZone, toggleMethod } from '@/features/settings/shipping/lib/shipping-zone-operations';
import {
  type ShippingSettingsFormInput,
  type ShippingSettingsFormPayload,
  ShippingSettingsFormSchema,
} from '@/features/settings/shipping/schemas/forms/shipping-settings-form';
import type { CountryWithStates, ShippingMethodData, ShippingZone } from '@/features/settings/shipping/types';
import { type ErrorResponse, getErrorsObject } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import type { RegionsDialogFormPayload } from '@/schemas/shared/region';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { FormErrors } from '@/types/pages/common';
import { uuid } from '@/utils';
import { normalizeErrors } from '@/utils/common';
import { __ } from '@/wpi18n';

const ShippingRoutes = RouteConfig.Settings.get('ShippingSettings');

type SettingsOutletContext = {
  confirmAction: (opts: {
    action: () => void;
    otherProps?: Record<string, unknown>;
  }) => void;
};

type UseShippingSettingsResult = {
  form: UseFormReturn<ShippingSettingsFormInput, unknown, ShippingSettingsFormPayload>;
  loaded: boolean;
  shippingZonesObj: ShippingZone[];
  countryList: CountryWithStates[];
  searchValue: string;
  setSearchValue: (value: string) => void;
  showCreateZonePopup: boolean;
  setShowCreateZonePopup: (open: boolean) => void;
  popupErrors: FormErrors;
  getShippingMethodData: (zoneId: string | number) => ShippingMethodData[];
  handleToggleMethod: (method: ShippingMethodData) => void;
  handleEditMethod: (method: ShippingMethodData) => void;
  handleDeleteMethod: (method: ShippingMethodData) => void;
  handleToggleZoneItem: (item: ShippingZone) => void;
  handleDeleteItem: (item: ShippingZone) => Promise<void>;
  handleCreateZone: (values: RegionsDialogFormPayload) => Promise<void>;
};

export const useShippingSettings = (): UseShippingSettingsResult => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const newZoneIdRef = useRef(uuid());
  const [searchValue, setSearchValue] = useState('');
  const [showCreateZonePopup, setShowCreateZonePopup] = useState(false);
  const [popupErrors, setPopupErrors] = useState<FormErrors>({});

  const { data: countryData = [] } = useCountriesQuery({ limit: -1 });
  const countryList = countryData as CountryWithStates[];

  const { data: shippingSettingsData, isLoading } = useSettingsQuery('shipping');
  const { mutateAsync: updateSettings, isPending: isSaving } =
    useUpdateSettingsMutation<'shipping'>();

  const loaded = !isLoading && Boolean(shippingSettingsData);

  const form = useForm<ShippingSettingsFormInput, unknown, ShippingSettingsFormPayload>({
    resolver: zodResolver(ShippingSettingsFormSchema),
    defaultValues: getDefaults(ShippingSettingsFormSchema),
  });

  const { isDirty } = form.formState;
  const shippingZonesObj = (useWatch({ control: form.control, name: 'shipping_zones' }) as ShippingZone[]) || [];

  useEffect(() => {
    if (!shippingSettingsData || !Object.keys(shippingSettingsData).length) {
      return;
    }

    form.reset(pickFormValues(ShippingSettingsFormSchema, shippingSettingsData));
  }, [shippingSettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const setShippingZonesObj = (
    updater: ShippingZone[] | ((prev: ShippingZone[]) => ShippingZone[]),
    options?: { shouldDirty?: boolean },
  ) => {
    const current = (form.getValues('shipping_zones') as ShippingZone[]) || [];
    const next = typeof updater === 'function' ? updater(current) : updater;
    form.setValue(
      'shipping_zones',
      next as ShippingSettingsFormInput['shipping_zones'],
      {
        shouldDirty: options?.shouldDirty ?? false,
      },
    );
  };

  const handleDeleteItem = async (item: ShippingZone) => {
    const updatedZones = removeZone(shippingZonesObj, item.id);
    setShippingZonesObj(updatedZones, { shouldDirty: false });

    try {
      await updateSettings({
        key: 'shipping',
        data: { shipping_zones: updatedZones },
      });
      form.reset({
        ...form.getValues(),
        shipping_zones: updatedZones,
      });
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const getShippingMethodData = (zoneId: string | number): ShippingMethodData[] =>
    getZoneShippingMethods(shippingZonesObj, zoneId);

  const handleToggleMethod = (method: ShippingMethodData) => {
    setShippingZonesObj(
      (prev) => {
        if (!Array.isArray(prev)) {
          return prev;
        }
        return toggleMethod(prev, method.zoneId!, method.id);
      },
      { shouldDirty: true },
    );
  };

  const handleEditMethod = (method: ShippingMethodData) => {
    confirmAction({
      action: () =>
        navigate(
          `${ShippingRoutes.get('ShippingDeliveryMethod').buildLink()}?methodId=${method.id}&zoneId=${method.zoneId}`,
        ),
    });
  };

  const handleDeleteMethod = (method: ShippingMethodData) => {
    confirmAction({
      action: async () => {
        const updatedZones = shippingZonesObj.map((zone) => {
          if (zone.id !== method.zoneId) {
            return zone;
          }
          return {
            ...zone,
            shipping_methods: (zone.shipping_methods || []).filter(
              (item) => item.id !== method.id,
            ),
          };
        });
        setShippingZonesObj(updatedZones, { shouldDirty: false });

        try {
          await updateSettings({
            key: 'shipping',
            data: { shipping_zones: updatedZones },
          });
          form.reset({
            ...form.getValues(),
            shipping_zones: updatedZones,
          });
        } catch (error) {
          applyServerErrors(form, error as ErrorResponse);
        }
      },
      otherProps: {
        variant: 'delete',
        force: true,
        title: __('Delete shipping method?', 'kirki-ecommerce'),
        subtitle: __(
          'Are you sure you want to delete this shipping method? This action cannot be undone.',
          'kirki-ecommerce',
        ),
      },
    });
  };

  const handleToggleZoneItem = (item: ShippingZone) => {
    setShippingZonesObj(
      (prev) => {
        if (!Array.isArray(prev)) {
          return prev;
        }
        const newValue = !item.is_enabled;
        return prev.map((zone) =>
          zone.id === item.id ? { ...zone, is_enabled: newValue } : zone,
        );
      },
      { shouldDirty: true },
    );
  };

  const handleCreateZone = async (values: RegionsDialogFormPayload) => {
    const updatedZones: ShippingZone[] = [
      ...shippingZonesObj,
      {
        id: newZoneIdRef.current,
        is_enabled: true,
        title: values.title || '',
        regions: values.regions,
        shipping_methods: [],
        shipping_careers: [],
      },
    ];

    try {
      await updateSettings({
        key: 'shipping',
        data: { shipping_zones: updatedZones },
      });
      setShowCreateZonePopup(false);
      void navigate(ShippingRoutes.get('ShippingZone').buildLink({ zone_Id: newZoneIdRef.current }));
      newZoneIdRef.current = uuid();
    } catch (error) {
      const errObj = error as ErrorResponse;
      setPopupErrors(
        normalizeErrors(getErrorsObject(errObj.errors)) as FormErrors,
      );
    }
  };

  const handleSaveZones = async (payload: ShippingSettingsFormPayload) => {
    try {
      await updateSettings({
        key: 'shipping',
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
    onSave: form.handleSubmit(handleSaveZones),
    onDiscard: handleDiscardData,
  });

  return {
    form,
    loaded,
    shippingZonesObj,
    countryList,
    searchValue,
    setSearchValue,
    showCreateZonePopup,
    setShowCreateZonePopup,
    popupErrors,
    getShippingMethodData,
    handleToggleMethod,
    handleEditMethod,
    handleDeleteMethod,
    handleToggleZoneItem,
    handleDeleteItem,
    handleCreateZone,
  };
};
