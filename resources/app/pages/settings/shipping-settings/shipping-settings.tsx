import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import { LocationIcon, TruckIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { TagManager } from '@/molecules/tag-manager';
import PageNavbar from '@/components/page-navbar';
import OptionAccordion from '@/components/option-accordion';
import HeaderActionsCard from '@/components/header-actions-card';
import { getErrorsObject } from '@/libs/api';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { normalizeErrors } from '@/pages/utils';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { FormErrors, SelectOption, SettingsSectionData } from '@/types';
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
import { ShippingRegionPopup } from '@/pages/settings/shipping-settings/shipping-zone/shipping-region-popup';
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
  const [shippingZonesObj, setShippingZonesObj] = useState<ShippingZone[]>([]);
  const [shippingZoneTitle, setShippingZoneTitle] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const hasUnsavedData = useUnsavedStatus();
  const { data: countryData = [] } = useCountriesQuery({ limit: -1 });
  const countryList = countryData as CountryWithStates[];

  const { data: shippingSettingsData, isLoading } = useSettingsQuery('shipping');
  const { mutate: updateSettings } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(shippingSettingsData);

  useEffect(() => {
    if (Object.keys(shippingSettingsData || {}).length) {
      const zones = shippingSettingsData?.['shipping_zones'];
      setShippingZonesObj(Array.isArray(zones) ? (zones as ShippingZone[]) : []);
    }
  }, [shippingSettingsData]);

  const handleDeleteItem = (item: ShippingZone) => {
    const updatedZones = shippingZonesObj?.filter(
      (zone) => zone.id !== item.id,
    );
    setShippingZonesObj(updatedZones);

    updateSettings(
      {
        key: 'shipping',
        data: {
          ...shippingSettingsData,
          shipping_zones: updatedZones,
        } as SettingsSectionData,
      },
      {
        onSuccess: () => setUnsavedDataStatus(false),
      },
    );
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

  const trackHasUnsavedData = (
    currentZones: ShippingZone[],
    originalZones: ShippingZone[],
  ): boolean => {
    return currentZones.some((zone) => {
      const original = originalZones.find((z) => z.id === zone.id);
      return original && zone.is_enabled !== original.is_enabled;
    });
  };

  const handleToggleZoneItem = (item: ShippingZone) => {
    setShippingZonesObj((prev) => {
      if (!Array.isArray(prev)) {
        return prev;
      }
      const newValue = !item.is_enabled;
      const updated = prev.map((zone) =>
        zone.id === item.id ? { ...zone, is_enabled: newValue } : zone,
      );
      const originalZones = (shippingSettingsData?.shipping_zones ??
        []) as ShippingZone[];
      const isDataUnsaved = trackHasUnsavedData(updated, originalZones);
      setUnsavedDataStatus(isDataUnsaved);
      return updated;
    });
  };

  const handleCreateZone = () => {
    const updatedZones: ShippingZone[] = [
      ...shippingZonesObj,
      {
        id: newZoneIdRef.current,
        is_enabled: true,
        title: shippingZoneTitle,
        regions: selectedRegion,
        shipping_methods: [],
        shipping_careers: [],
      },
    ];

    updateSettings(
      {
        key: 'shipping',
        data: { shipping_zones: updatedZones },
      },
      {
        onSuccess: () => {
          setShowCreateZonePopup(false);
          navigate(`/settings/shipping/zone/${newZoneIdRef.current}`);
          newZoneIdRef.current = crypto.randomUUID();
        },
        onError: (error) => {
          const errObj = error as { errors?: Record<string, string[]> };
          setErrors(normalizeErrors(getErrorsObject(errObj.errors)) as FormErrors);
        },
      },
    );
  };

  const handleSaveZones = () => {
    updateSettings(
      {
        key: 'shipping',
        data: {
          ...shippingSettingsData,
          shipping_zones: shippingZonesObj,
        } as SettingsSectionData,
      },
      {
        onSuccess: () => setUnsavedDataStatus(false),
      },
    );
  };

  const handleBackButton = () => {
    confirmAction({ action: () => navigate('/settings') });
  };

  const handleDiscardData = () => {
    const zones = shippingSettingsData?.['shipping_zones'];
    setShippingZonesObj(
      Array.isArray(zones) ? (zones as ShippingZone[]) : [],
    );
    setUnsavedDataStatus(false);
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
                onClick={handleDiscardData}
                size="small"
              />
              <Button
                type="primary"
                text={__('Save', 'kirki-ecommerce')}
                size="small"
                onClick={handleSaveZones}
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Flex direction="column" gap={16}>
            <PageNavbar
              handleBack={handleBackButton}
              textIcon={<TruckIcon />}
              text={__('Shipping', 'kirki-ecommerce')}
            />
            <Card type="large">
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
                <Card
                  type="innerDark"
                  style={{
                    padding: 'var(--decom-spacing-9) var(--decom-spacing-0)',
                  }}
                >
                  <Flex
                    direction="column"
                    gap={8}
                    style={{ alignItems: 'center' }}
                  >
                    <LocationIcon />
                    <span style={{ color: 'var(--decom-text-text-subdued)' }}>
                      {__(
                        'Added shipping zones will appear here',
                        'kirki-ecommerce',
                      )}
                    </span>
                  </Flex>
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
                      <TagManager
                        showInputField={false}
                        selectedTags={
                          getSelectedRegionTags(
                            item?.regions,
                            countryList as CountryWithStates[] | null,
                          ) as unknown as SelectOption[]
                        }
                        showRemoveIcon={false}
                      />
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
            </Card>
            <ShippingProfile />
            <ShippingBox />
          </Flex>
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
          shippingZoneTitle={shippingZoneTitle}
          setShippingZoneTitle={setShippingZoneTitle}
          errors={errors}
        />
      )}
    </>
  );
};

ShippingSettings.displayName = 'ShippingSettings';

export default ShippingSettings;
