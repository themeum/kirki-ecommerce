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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getSettingsAPI,
  updateSettingsAPI,
  updateSettings,
  setActiveZoneId,
  setSelectedCountryList,
} from '@/store/settingsSlice';
import { getCountriesAPI } from '@/store/countriesSlice';
import { useGetListAPI } from '@/hooks';
import { dispatchToastMessage, normalizeErrors } from '@/pages/utils';
import type { FormErrors, SelectOption, SettingsSectionData } from '@/types';
import { isApiSuccess } from '@/types';
import { __ } from '@/wpi18n';

import { ShippingRegionPopup } from './shipping-region-popup';
import { ShippingMethod } from '../shipping-method/shipping-method';
import {
  getSearchedCountries,
  getSelectedRegionTags,
  type CountryWithStates,
  type RegionTag,
  type ShippingMethodData,
  type ShippingRegion,
  type ShippingZone,
} from '../utils';
import {
  checkUnsavedDataStatus,
  setUnsavedDataStatus,
} from '../../utils';

type SettingsOutletContext = {
  confirmAction: (opts: {
    action: () => void;
    otherProps?: Record<string, unknown>;
  }) => void;
};

const ShippingZonePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const { zone_Id } = useParams();
  const [openPopup, setOpenPopup] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const hasUnsavedData = useAppSelector((state) => state.unsaved?.hasUnsavedData);
  const countryList = useAppSelector((state) => state.countries?.data);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion[]>([]);
  const [shippingZoneTitle, setShippingZoneTitle] = useState('');
  const [shippingZonesObj, setShippingZonesObj] = useState<ShippingZone[]>([]);
  const [initialDataObj, setInitialDataObj] = useState<ShippingZone | null>(
    null,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  useGetListAPI({
    reducerName: 'countries',
    apiCallBack: getCountriesAPI,
    limit: -1,
  });

  const {
    loaded,
    data: shippingSettingsData,
    activeZoneId,
    selectedCountryList,
  } = useAppSelector((state) => state.settings?.shipping);

  const zones = (shippingSettingsData?.shipping_zones as ShippingZone[]) || [];
  const zoneId = zone_Id || activeZoneId;

  const activeZone = zones.find((zone) => zone.id === zoneId);

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
    if (!loaded) {
      dispatch(getSettingsAPI('shipping'));
    }
  }, []);

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
    const currentZone = shippingZonesObj.find((zone) => zone.id === zoneId);
    if (!currentZone) {
      return;
    }

    setShippingZoneTitle(currentZone.title);
    setSelectedRegion(currentZone.regions);

    if (
      Array.isArray(selectedCountryList) &&
      selectedCountryList.length
    ) {
      setSelectedCountries(selectedCountryList as string[]);
    } else {
      const derivedCountries = currentZone.regions.map((r) => r.country);
      setSelectedCountries(derivedCountries);
    }

    if (zoneId !== undefined && zoneId !== null) {
      dispatch(setActiveZoneId(zoneId as number));
    }
  }, [zoneId, shippingZonesObj, selectedCountryList]);

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
        zone.id === zoneId
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
        zone.id === zoneId ? { ...zone, title } : zone,
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
        zone.id === zoneId
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

  const updateShippingZone = async () => {
    const result = await updateSettingsAPI('shipping', {
      shipping_zones: shippingZonesObj,
    });

    if (isApiSuccess(result)) {
      dispatch(
        updateSettings({
          key: 'shipping',
          value: result.data as SettingsSectionData,
        }),
      );
      dispatch(setSelectedCountryList(selectedCountries));
      if (zoneId !== undefined && zoneId !== null) {
        dispatch(setActiveZoneId(zoneId as number));
      }
      setUnsavedDataStatus(false);
      dispatchToastMessage('success', {
        title: __('Shipping zone updated', 'kirki-ecommerce'),
      });
    } else {
      const errorResult = result as { errors?: Record<string, unknown> };
      setErrors(normalizeErrors(errorResult?.errors) as FormErrors);
    }
  };

  const handleBackButton = () => {
    const activeZoneData = shippingZonesObj?.find(
      (zone) => zone?.id === zoneId,
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

  const methodListKey =
    activeZoneId !== null && activeZoneId !== undefined
      ? activeZoneId
      : zoneId;

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
                methodListKey !== undefined && methodListKey !== null
                  ? shippingMethodList[methodListKey] || []
                  : []
              }
              shippingZonesObj={shippingZonesObj}
              setShippingZonesObj={setShippingZonesObj}
            />
            {/* <ShippingCareer /> */}
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
