import { useState, useMemo, useEffect } from 'react';
import { Minus } from 'lucide-react';
import { mergeCss } from '@/theme/mixins';
import { useParams, useNavigate } from 'react-router';

import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Card, CardContent } from '@/components/ui/card';
import Chip from '@/components/ui/chip';
import ChipField, { chipFieldControlCss } from '@/components/ui/chip-field';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';
import { getErrorsObject } from '@/libs/api';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { dispatchToastMessage, normalizeErrors } from '@/pages/utils';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { FormErrors } from '@/types';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import { ShippingRegionPopup } from '@/pages/settings/shipping-settings/shipping-zone/shipping-region-dialog';
import { ShippingMethod } from '@/pages/settings/shipping-settings/shipping-method/shipping-method';
import { getSearchedCountries, getSelectedRegionTags, type CountryWithStates, type RegionTag, type ShippingMethodData, type ShippingRegion, type ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import { useSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import SettingsPageHeader from '@/pages/settings/settings-page-header';

const ShippingZonePage = () => {
  const navigate = useNavigate();

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
  const { mutate: saveSettings } = useUpdateSettingsMutation<'shipping'>();

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

  const regionTags = useMemo(
    () => getSelectedRegionTags(selectedRegion, countryList),
    [selectedRegion, countryList],
  );

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
        data: { shipping_zones: shippingZonesObj },
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

  const handleDiscardData = () => {
    setShippingZonesObj((prev = []) =>
      prev.map((zone) =>
        zone.id === activeZone?.id && initialDataObj ? initialDataObj : zone,
      ),
    );
    setUnsavedDataStatus(false);
  };

  useSettingsPageActions({
    isDirty: hasUnsavedData,
    onSave: updateShippingZone,
    onDiscard: handleDiscardData,
  });

  return (
    <>
      <Container size="sm">
        {loaded ? (
          <Flex direction="column" gap={4}>
            <SettingsPageHeader
              title={__('Set Zone Details', 'kirki-ecommerce')}
              onBack={() => navigate('/settings/shipping')}
            />
            <Card cssOverride={mergeCss(cardStyles.largeCard, cardStyles.formCard)} >
              <CardContent cssOverride={cardStyles.largeContentPadded}>

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
              {/* Not a MultiSelect: regions are picked in their own dialog,
                  so this is the chip frame with a read-only trigger. */}
              <Field data-invalid={errors?.regions ? true : undefined}>
                <FieldLabel>{__('Regions', 'kirki-ecommerce')}</FieldLabel>
                <ChipField
                  error={Boolean(errors?.regions)}
                  control={
                    <Input
                      readOnly
                      placeholder={__(
                        'Click to add destinations..',
                        'kirki-ecommerce',
                      )}
                      cssOverride={chipFieldControlCss}
                      onClick={() => setOpenPopup(true)}
                    />
                  }
                  chips={
                    regionTags.length > 0
                      ? regionTags.map((tag) => (
                        <Chip
                          key={tag.id}
                          text={tag.title}
                          img={tag.tagIcon}
                          subText={tag.subText}
                          closeIcon={<Minus size={14} aria-hidden="true" />}
                          onRemove={() => handleRemoveRegionTag(tag)}
                        />
                      ))
                      : undefined
                  }
                />
                {typeof errors?.regions === 'string' && (
                  <FieldError>{errors.regions}</FieldError>
                )}
              </Field>

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

