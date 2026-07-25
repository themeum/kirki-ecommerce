import { useState, useMemo, useEffect } from 'react';
import {
  useParams,
  useOutletContext,
  useNavigate,
} from 'react-router';

import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import TagManager from '@/components/tag-manager/tag-manager';
import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import Input from '@/components/ui/input';
import { getErrorsObject } from '@/libs/api';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { dispatchToastMessage, normalizeErrors } from '@/pages/utils';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { FormErrors, SelectOption, SettingsSectionData } from '@/types';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import { ShippingRegionPopup } from '@/pages/settings/shipping-settings/shipping-zone/shipping-region-dialog';
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

  const handleShippingZoneTitle = (title: string) => {
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

  const handleAddRegion = (values?: {
    regions?: ShippingRegion[];
    countries?: string[];
  }) => {
    const regions = values?.regions ?? selectedRegion;
    if (regions?.length < 1) {
      dispatchToastMessage('warning', {
        title: __('Regions cannot be empty', 'kirki-ecommerce'),
      });
      return;
    }
    if (values?.countries) {
      setSelectedCountries(values.countries);
    }
    setSelectedRegion(regions);
    setErrors({ ...errors, regions: '' });
    setShippingZonesObj((prevZones) =>
      prevZones.map((zone) =>
        String(zone.id) === String(zoneId)
          ? {
              ...zone,
              regions,
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
              <Button variant="ghost" onClick={handleDiscardData}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button variant="primary" onClick={updateShippingZone}>
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
          <Flex direction="column" gap={4}>
            <PageNavbar
              text={__('Set Zone Details', 'kirki-ecommerce')}
              handleBack={handleBackButton}
            />
            <Card css={[cardStyles.largeCard, cardStyles.formCard]} >
              <CardContent css={cardStyles.largeContentPadded}>

              <Field data-invalid={errors?.title ? true : undefined}>
                <FieldLabel htmlFor="shipping-zone-title">
                  {__('Title', 'kirki-ecommerce')}
                </FieldLabel>
                <Input
                  id="shipping-zone-title"
                  placeholder="Zone 2- South Asia"
                  value={shippingZoneTitle}
                  onChange={(e) => handleShippingZoneTitle(e.target.value)}
                  error={Boolean(errors?.title)}
                  aria-invalid={Boolean(errors?.title) || undefined}
                />
                {typeof errors?.title === 'string' && (
                  <FieldError>{errors.title}</FieldError>
                )}
              </Field>
              <TagManager
              label={__('Regions', 'kirki-ecommerce')}
              placeholder={__(
              'Click to add destinations..',
              'kirki-ecommerce',
              )}
              readOnly
              hasAddBtn={false}
              onClick={() => setOpenPopup(true)}
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
              onSave={handleAddRegion}
              />
              )}
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
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

ShippingZonePage.displayName = 'ShippingZone';

export default ShippingZonePage;

