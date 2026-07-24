import { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useOutletContext } from 'react-router';

import { LocationIcon, TruckIcon } from '@/icons';
import PageNavbar from '@/components/page-navbar';
import OptionAccordion from '@/components/option-accordion';
import HeaderActionsCard from '@/components/header-actions-card';
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { getErrorsObject, type ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import Chip from '@/components/ui/chip';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { normalizeErrors } from '@/pages/utils';
import {
  ShippingSettingsFormSchema,
  shippingSettingsDefaultValues,
  type ShippingSettingsFormValues,
} from '@/schemas/forms/shipping-settings-form';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { FormErrors, SelectOption, SettingsSectionData } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __, sprintf } from '@/wpi18n';

import {
  getSearchedCountries,
  getSelectedRegionTags,
  shippingMethodIconMap,
  type CountryWithStates,
  type ShippingMethodData,
  type ShippingRegion,
  type ShippingZone,
} from '@/pages/settings/shipping-settings/utils';
import { ShippingMethod } from '@/pages/settings/shipping-settings/shipping-method/shipping-method';
import { ShippingRegionPopup } from '@/pages/settings/shipping-settings/shipping-zone/shipping-region-dialog';
import ShippingZoneActions from '@/pages/settings/shipping-settings/shipping-zone-actions';
import ShippingProfile from '@/pages/settings/shipping-settings/shipping-profile/shipping-profile';
import ShippingBox from '@/pages/settings/shipping-settings/shipping-box/shipping-box';
import { setUnsavedDataStatus } from '@/pages/settings/utils';

type SettingsOutletContext = {
  confirmAction: (opts: {
    action: () => void;
    otherProps?: Record<string, unknown>;
  }) => void;
};

const ShippingSettings = () => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const newZoneIdRef = useRef(crypto.randomUUID());
  const [searchValue, setSearchValue] = useState('');
  const [showCreateZonePopup, setShowCreateZonePopup] = useState(false);
  const [shippingZoneTitle, setShippingZoneTitle] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion[]>([]);
  const [popupErrors, setPopupErrors] = useState<FormErrors>({});

  const hasUnsavedData = useUnsavedStatus();
  const { data: countryData = [] } = useCountriesQuery({ limit: -1 });
  const countryList = countryData as CountryWithStates[];

  const { data: shippingSettingsData, isLoading } = useSettingsQuery('shipping');
  const { mutateAsync: updateSettings, isPending: isSaving } =
    useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(shippingSettingsData);

  const form = useForm<ShippingSettingsFormValues>({
    resolver: zodResolver(ShippingSettingsFormSchema),
    defaultValues: shippingSettingsDefaultValues,
  });

  const { isDirty } = form.formState;
  const shippingZonesObj =
    (useWatch({
      control: form.control,
      name: 'shipping_zones',
    }) as ShippingZone[]) || [];

  useEffect(() => {
    if (!shippingSettingsData || !Object.keys(shippingSettingsData).length) {
      return;
    }

    const zones = shippingSettingsData?.['shipping_zones'];
    form.reset({
      ...shippingSettingsDefaultValues,
      ...shippingSettingsData,
      shipping_zones: Array.isArray(zones) ? (zones as ShippingZone[]) : [],
    });
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
      next as ShippingSettingsFormValues['shipping_zones'],
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
        data: {
          ...shippingSettingsData,
          shipping_zones: updatedZones,
        } as SettingsSectionData,
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
      zoneId: zoneId,
    }));
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

  const handleCreateZone = async (values?: {
    title?: string | null;
    regions?: ShippingRegion[];
    countries?: string[];
  }) => {
    const title = values?.title ?? shippingZoneTitle;
    const regions = values?.regions ?? selectedRegion;

    const updatedZones: ShippingZone[] = [
      ...shippingZonesObj,
      {
        id: newZoneIdRef.current,
        is_enabled: true,
        title: title || '',
        regions,
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
      setShippingZoneTitle('');
      setSelectedCountries([]);
      setSelectedRegion([]);
      navigate(`/settings/shipping/zone/${newZoneIdRef.current}`);
      newZoneIdRef.current = crypto.randomUUID();
    } catch (error) {
      const errObj = error as ErrorResponse;
      setPopupErrors(
        normalizeErrors(getErrorsObject(errObj.errors)) as FormErrors,
      );
    }
  };

  const handleSaveZones = async (values: ShippingSettingsFormValues) => {
    try {
      await updateSettings({
        key: 'shipping',
        data: {
          ...shippingSettingsData,
          shipping_zones: values.shipping_zones,
        } as SettingsSectionData,
      });
      form.reset(values);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleBackButton = () => {
    if (isDirty) {
      confirmAction({ action: () => navigate('/settings') });
      return;
    }
    navigate('/settings');
  };

  const handleDiscardData = () => {
    form.reset();
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
                disabled={isSaving}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={form.handleSubmit(handleSaveZones)}
                loading={isSaving}
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
                handleBack={handleBackButton}
                textIcon={<TruckIcon />}
                text={__('Shipping', 'kirki-ecommerce')}
              />
              <Card css={cardStyles.largeCard}>
                <CardContent css={cardStyles.largeContentPadded}>
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
                    <Card css={cardStyles.innerDarkCard}>
                      <CardContent css={[cardStyles.innerDarkContent, styles.emptyState]}>
                        <Flex
                          direction="column"
                          gap={8}
                          style={{ alignItems: 'center' }}
                        >
                          <LocationIcon />
                          <span css={styles.emptyStateText}>
                            {__(
                              'Added shipping zones will appear here',
                              'kirki-ecommerce',
                            )}
                          </span>
                        </Flex>
                      </CardContent>
                    </Card>
                  ) : (
                  <Flex direction="column" gap={12}>
                    {shippingZonesObj?.map((item) => (
                      <OptionAccordion
                        key={item?.id}
                        header={sprintf(__('%s', 'kirki-ecommerce'), item.title)}
                        subHeader={`${item?.regions?.length} regions, ${item?.['shipping_methods']?.length} shipping methods`}
                        leftIcon={<LocationIcon height={20} width={20} />}
                        rightActions={
                          <ShippingZoneActions
                            item={item}
                            onToggle={handleToggleZoneItem}
                            onDelete={handleDeleteItem}
                          />
                        }
                        variant="shipping"
                        state={item?.is_enabled}
                      >
                        <Flex
                          gap={8}
                          style={{ flexWrap: 'wrap', rowGap: theme.spacing[2] }}
                        >
                          {(
                            getSelectedRegionTags(
                              item?.regions,
                              countryList as CountryWithStates[] | null,
                            ) as unknown as SelectOption[]
                          ).map((tag, index) => (
                            <Chip
                              key={`${tag.value}-${index}`}
                              text={tag.title}
                              color={tag.color}
                            />
                          ))}
                        </Flex>
                        {getShippingMethodData(item?.id).length > 0 && (
                          <ShippingMethod
                            from={'edit_zone'}
                            shippingSettingsData={shippingSettingsData}
                            shippingMethodList={getShippingMethodData(item?.id)}
                            shippingZonesObj={shippingZonesObj}
                            setShippingZonesObj={setShippingZonesObj}
                            zoneId={item?.id}
                          />
                        )}
                      </OptionAccordion>
                    ))}
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
          from={'add'}
          openPopup={showCreateZonePopup}
          setOpenPopup={setShowCreateZonePopup}
          setSearchValue={setSearchValue}
          filteredCountries={getSearchedCountries(
            searchValue,
            countryList as CountryWithStates[] | null,
          )}
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          onAdd={handleCreateZone}
          onSave={handleCreateZone}
          shippingZoneTitle={shippingZoneTitle}
          setShippingZoneTitle={setShippingZoneTitle}
          errors={popupErrors}
        />
      )}
    </>
  );
};

ShippingSettings.displayName = 'ShippingSettings';

export default ShippingSettings;

const styles = {
  emptyState: scoped({
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  }),
  emptyStateText: scoped({
    color: theme.colors.text.subdued,
  })
};
