import { useState, useMemo, useEffect } from 'react';
import {
  useParams,
  useOutletContext,
  useNavigate,
} from 'react-router';

import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import PageHeading from '@/molecules/page-heading';
import { TagManager } from '@/molecules/tag-manager';
import PageNavbar from '@/components/page-navbar';
import { getErrorsObject } from '@/libs/api';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { dispatchToastMessage, normalizeErrors } from '@/pages/utils';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { FormErrors, SelectOption, SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import { ShippingRegionPopup } from '@/pages/settings/shipping-settings/shipping-zone/shipping-region-popup';
import { ShippingMethod } from '@/pages/settings/shipping-settings/shipping-method/shipping-method';
import {
  getSearchedCountries,
  getSelectedRegionTags,
  type CountryWithStates,
  type RegionTag,
  type ShippingMethodData,
  type ShippingRegion,
  type ShippingZone,
} from '@/pages/settings/shipping-settings/utils';
import {
  checkUnsavedDataStatus,
  setUnsavedDataStatus,
} from '@/pages/settings/utils';

type SettingsOutletContext = {
  confirmAction: (opts: {
    action: () => void;
    otherProps?: Record<string, unknown>;
  }) => void;
};

const ShippingZonePage = () => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const { zone_Id } = useParams();
  const [openPopup, setOpenPopup] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const hasUnsavedData = useUnsavedStatus();
  const { data: countryData = [] } = useCountriesQuery({ limit: -1 });
  const countryList = countryData as CountryWithStates[];

  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion[]>([]);
  const [shippingZoneTitle, setShippingZoneTitle] = useState('');
  const [shippingZonesObj, setShippingZonesObj] = useState<ShippingZone[]>([]);
  const [initialDataObj, setInitialDataObj] = useState<ShippingZone | null>(
    null,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: shippingSettingsData, isLoading } = useSettingsQuery('shipping');
  const { mutate: saveSettings } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(shippingSettingsData);
  const zones = (shippingSettingsData?.shipping_zones as ShippingZone[]) || [];
  const zoneId = zone_Id;

  const activeZone = zones.find((zone) => String(zone.id) === String(zoneId));

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
    setInitialDataObj(activeZone ?? null);
  }, [zones]);

  useEffect(() => {
    if (!shippingZonesObj.length) {
      return;
    }
    const currentZone = shippingZonesObj.find(
      (zone) => String(zone.id) === String(zoneId),
    );
    if (!currentZone) {
      return;
    }

    setShippingZoneTitle(currentZone.title);
    setSelectedRegion(currentZone.regions);

    const derivedCountries = currentZone.regions.map((r) => r.country);
    setSelectedCountries(derivedCountries);
  }, [zoneId, shippingZonesObj]);

  const handleRemoveRegionTag = (removedTag: RegionTag) => {
    if (selectedCountries.length <= 1 || selectedRegion.length <= 1) {
      dispatchToastMessage('warning', {
        title: __('Regions cannot be empty', 'kirki-ecommerce'),
      });
      return;
    }
    setSelectedCountries((prev) =>
      prev.filter((country) => country !== removedTag?.id),
    );

    setSelectedRegion((prev) =>
      prev.filter((item) => item.country !== removedTag.id),
    );
    setShippingZonesObj((prevZones) =>
      prevZones.map((zone) =>
        String(zone.id) === String(zoneId)
          ? {
              ...zone,
              regions: zone.regions.filter((r) => r.country !== removedTag.id),
            }
          : zone,
      ),
    );
    setUnsavedDataStatus(true);
  };

  const handleShippingZoneTitle = (value: string | number) => {
    const title = String(value);
    setShippingZoneTitle(title);
    setUnsavedDataStatus(true);
    setShippingZonesObj((prev) =>
      prev.map((zone) =>
        String(zone.id) === String(zoneId) ? { ...zone, title } : zone,
      ),
    );
    setErrors((prev) => {
      return {
        ...prev,
        ['title']: '',
      };
    });
  };

  const handleAddRegion = () => {
    if (selectedRegion?.length < 1) {
      dispatchToastMessage('warning', {
        title: __('Regions cannot be empty', 'kirki-ecommerce'),
      });
      return;
    }
    setErrors({ ...errors, regions: '' });
    setShippingZonesObj((prevZones) =>
      prevZones.map((zone) =>
        String(zone.id) === String(zoneId)
          ? {
              ...zone,
              regions: selectedRegion,
            }
          : zone,
      ),
    );
    setOpenPopup(false);
    setUnsavedDataStatus(true);
  };

  const updateShippingZone = () => {
    saveSettings(
      {
        key: 'shipping',
        data: { shipping_zones: shippingZonesObj } as SettingsSectionData,
      },
      {
        onSuccess: () => {
          setUnsavedDataStatus(false);
        },
        onError: (error) => {
          const errObj = error as { errors?: Record<string, unknown> };
          setErrors(normalizeErrors(getErrorsObject(errObj.errors as Record<string, string[]>)) as FormErrors);
        },
      },
    );
  };

  const handleBackButton = () => {
    const activeZoneData = shippingZonesObj?.find(
      (zone) => String(zone?.id) === String(zoneId),
    );

    checkUnsavedDataStatus({
      initialDataObj,
      updatedDataObj: activeZoneData,
      keysToCompare: ['title', 'regions'],
      onUnsaved: () =>
        confirmAction({ action: () => navigate('/settings/shipping') }),
      onClean: () => {
        navigate('/settings/shipping');
      },
    });
  };

  const handleDiscardData = () => {
    setShippingZonesObj((prev = []) =>
      prev.map((zone) =>
        zone.id === activeZone?.id && initialDataObj ? initialDataObj : zone,
      ),
    );
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
                onClick={handleDiscardData}
              />
              <Button
                type="primary"
                text={__('Save', 'kirki-ecommerce')}
                onClick={updateShippingZone}
                size="small"
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
              text={__('Set Zone Details', 'kirki-ecommerce')}
              handleBack={handleBackButton}
            />
            <Card type="large" style={{ gap: 'var(--decom-spacing-4)' }}>
              <Input
                label={__('Title', 'kirki-ecommerce')}
                placeholder="Zone 2- South Asia"
                value={shippingZoneTitle}
                onChange={(value) => handleShippingZoneTitle(value)}
                error={(errors?.title as string) || ''}
              />
              <TagManager
                label={__('Regions', 'kirki-ecommerce')}
                placeholder={__(
                  'Click to add destinations..',
                  'kirki-ecommerce',
                )}
                readOnly
                onClick={() => setOpenPopup(true)}
                showSuggestionDropdown={false}
                selectedTags={
                  getSelectedRegionTags(
                    selectedRegion,
                    countryList as CountryWithStates[] | null,
                  ) as unknown as SelectOption[]
                }
                onTagRemove={(tag) =>
                  handleRemoveRegionTag(tag as unknown as RegionTag)
                }
                error={(errors?.regions as string) || ''}
              />

              {openPopup && (
                <ShippingRegionPopup
                  filteredCountries={getSearchedCountries(
                    searchValue,
                    countryList as CountryWithStates[] | null,
                  )}
                  openPopup={openPopup}
                  setOpenPopup={setOpenPopup}
                  setSearchValue={setSearchValue}
                  selectedCountries={selectedCountries}
                  setSelectedCountries={setSelectedCountries}
                  selectedRegion={selectedRegion}
                  setSelectedRegion={setSelectedRegion}
                  setShippingZoneTitle={setShippingZoneTitle}
                  from="edit"
                  onAdd={handleAddRegion}
                />
              )}
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
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

ShippingZonePage.displayName = 'ShippingZone';

export default ShippingZonePage;
