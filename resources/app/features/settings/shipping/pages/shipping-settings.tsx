import { zodResolver } from '@hookform/resolvers/zod';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router';

import HeaderActionsCard from '@/components/header-actions-card';
import OptionAccordion from '@/components/option-accordion';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { ItemGroup, ItemSeparator } from '@/components/ui/item';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { getSearchedCountries, getSelectedRegionTags, getShippingMethodRightText, getShippingMethodSubText, getShippingZoneSummary, shippingMethodIconMap } from '@/features/settings/shipping/lib/utils';
import ShippingBox from '@/features/settings/shipping/pages/shipping-box/shipping-box';
import ShippingMethodRow from '@/features/settings/shipping/pages/shipping-method-row';
import ShippingProfile from '@/features/settings/shipping/pages/shipping-profile/shipping-profile';
import { ShippingRegionPopup } from '@/features/settings/shipping/pages/shipping-zone/shipping-region-dialog';
import ShippingZoneActions from '@/features/settings/shipping/pages/shipping-zone-actions';
import type { ShippingRegionFormPayload } from '@/features/settings/shipping/schemas/forms/shipping-region-form';
import {
  type ShippingSettingsFormInput,
  type ShippingSettingsFormPayload,
  ShippingSettingsFormSchema,
} from '@/features/settings/shipping/schemas/forms/shipping-settings-form';
import type { CountryWithStates, ShippingMethodData, ShippingZone } from '@/features/settings/shipping/types';
import { LocationIcon, TruckIcon } from '@/icons';
import { type ErrorResponse, getErrorsObject } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
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

const ShippingSettings = () => {
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
    const updatedZones = shippingZonesObj?.filter(
      (zone) => zone.id !== item.id,
    );
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

  const getShippingMethodData = (
    zoneId: string | number,
  ): ShippingMethodData[] => {
    const selectedZone = shippingZonesObj?.find((zone) => zone.id === zoneId);
    if (!selectedZone) {
      return [];
    }

    return (selectedZone.shipping_methods || []).map((method) => ({
      ...method,
      icon: shippingMethodIconMap[method.type] || null,
      subText: getShippingMethodSubText(method),
      rightText: getShippingMethodRightText(method),
      zoneId,
    }));
  };

  const handleToggleMethod = (method: ShippingMethodData) => {
    setShippingZonesObj(
      (prev) => {
        if (!Array.isArray(prev)) {
          return prev;
        }
        return prev.map((zone) => {
          if (zone.id !== method.zoneId) {
            return zone;
          }
          return {
            ...zone,
            shipping_methods: (zone.shipping_methods || []).map((item) =>
              item.id === method.id
                ? { ...item, is_enabled: !(item.is_enabled ?? true) }
                : item,
            ),
          };
        });
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

  const handleCreateZone = async (values: ShippingRegionFormPayload) => {
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

  return (
    <>
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <SettingsPageHeader
                icon={<TruckIcon />}
                title={__('Shipping', 'kirki-ecommerce')}
              />
              <Card cssOverride={cardStyles.formCard}>
                <CardContent cssOverride={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
                  <HeaderActionsCard
                    header={__('Shipping Zones', 'kirki-ecommerce')}
                    subHeader={__(
                      'A shipping zone includes regions you ship to and available methods. Each shopper is matched to one zone based on their address.',
                      'kirki-ecommerce',
                    )}
                    buttonText={__('Create Zone', 'kirki-ecommerce')}
                    onAdd={() => setShowCreateZonePopup(true)}
                  />

                  {!shippingZonesObj.length ? (
                    <Card cssOverride={cardStyles.innerDarkCard}>
                      <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyState)}>
                        <Flex
                          direction="column"
                          gap={2}
                          align="center">
                          <LocationIcon />
                          <span css={scoped(styles.emptyStateText)}>
                            {__(
                              'Added shipping zones will appear here',
                              'kirki-ecommerce',
                            )}
                          </span>
                        </Flex>
                      </CardContent>
                    </Card>
                  ) : (
                    <Flex direction="column" gap={3}>
                      {shippingZonesObj?.map((item) => {
                        const zoneMethods = getShippingMethodData(item?.id);

                        return (
                          <OptionAccordion
                            key={item?.id}
                            header={item.title}
                            subHeader={getShippingZoneSummary(item)}
                            leftIcon={<LocationIcon height={20} width={20} />}
                            rightActions={
                              <ShippingZoneActions
                                item={item}
                                onToggle={handleToggleZoneItem}
                                onDelete={handleDeleteItem}
                              />
                            }
                            variant="shipping"
                            enabled={item?.is_enabled}
                          >
                            <Card cssOverride={cardStyles.innerCard}>
                              <CardContent cssOverride={cardStyles.innerContent}>
                                <Flex gap={2} wrap="wrap">
                                  {getSelectedRegionTags(
                                    item?.regions,
                                    countryList as CountryWithStates[] | null,
                                  ).map((tag) => (
                                    <Badge variant="default" key={tag.id}>
                                      <Flex align="center" gap={1}>
                                        <span css={scoped({ fontSize: 20 })}>
                                          {tag.tagIcon}
                                        </span>
                                        <Text variant="small" color="primary" weight="medium">
                                          {tag.title}
                                        </Text>
                                        {tag.subText && (
                                          <Text variant="small" color="subdued">
                                            {tag.subText}
                                          </Text>
                                        )}
                                      </Flex>
                                    </Badge>

                                  ))}
                                </Flex>
                              </CardContent>
                            </Card>
                            {zoneMethods.length > 0 && (
                              <Card cssOverride={cardStyles.innerCard}>
                                <CardContent cssOverride={cardStyles.tableContent}>
                                  <ItemGroup>
                                    {zoneMethods.map((method, index) => (
                                      <Fragment key={method.id}>
                                        {index > 0 && <ItemSeparator />}
                                        <ShippingMethodRow
                                          method={method}
                                          onToggle={handleToggleMethod}
                                          onEdit={handleEditMethod}
                                          onDelete={handleDeleteMethod}
                                        />
                                      </Fragment>
                                    ))}
                                  </ItemGroup>
                                </CardContent>
                              </Card>
                            )}
                          </OptionAccordion>
                        );
                      })}
                    </Flex>
                  )}
                </CardContent>
              </Card>
              <ShippingProfile />
              <ShippingBox />
            </Flex>
          </Form>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
      {showCreateZonePopup && (
        <ShippingRegionPopup
          from="add"
          open={showCreateZonePopup}
          onOpenChange={setShowCreateZonePopup}
          onSearchChange={setSearchValue}
          filteredCountries={getSearchedCountries(
            searchValue,
            countryList,
          )}
          onDone={handleCreateZone}
          errors={popupErrors}
        />
      )}
    </>
  );
};

ShippingSettings.displayName = 'ShippingSettings';

export default ShippingSettings;

const styles = defineStyles({
  emptyState: {
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  },
  emptyStateText: {
    color: theme.colors.text.subdued,
  },
});
