import { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';

import { LocationIcon, TruckIcon } from '@/icons';
import OptionAccordion from '@/components/option-accordion';
import HeaderActionsCard from '@/components/header-actions-card';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { getErrorsObject, type ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import Chip from '@/components/ui/chip';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { normalizeErrors } from '@/pages/utils';
import {
  ShippingSettingsFormSchema,
  type ShippingSettingsFormInput,
  type ShippingSettingsFormPayload,
} from '@/schemas/forms/shipping-settings-form';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { FormErrors, SelectOption } from '@/types';
import { theme } from '@/theme';
import { scoped, mergeCss, defineStyles } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __, sprintf } from '@/wpi18n';

import { getSearchedCountries, getSelectedRegionTags, shippingMethodIconMap, type CountryWithStates, type ShippingMethodData, type ShippingRegion, type ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { ShippingMethod } from '@/pages/settings/shipping-settings/shipping-method/shipping-method';
import { ShippingRegionPopup } from '@/pages/settings/shipping-settings/shipping-zone/shipping-region-dialog';
import ShippingZoneActions from '@/pages/settings/shipping-settings/shipping-zone-actions';
import ShippingProfile from '@/pages/settings/shipping-settings/shipping-profile/shipping-profile';
import ShippingBox from '@/pages/settings/shipping-settings/shipping-box/shipping-box';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import { useSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import SettingsPageHeader from '@/pages/settings/settings-page-header';

const ShippingSettings = () => {
  const navigate = useNavigate();

  const newZoneIdRef = useRef(crypto.randomUUID());
  const [searchValue, setSearchValue] = useState('');
  const [showCreateZonePopup, setShowCreateZonePopup] = useState(false);
  const [shippingZoneTitle, setShippingZoneTitle] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion[]>([]);
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
  const shippingZonesObj =
    (useWatch({
      control: form.control,
      name: 'shipping_zones',
    }) as ShippingZone[]) || [];

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
              <Card cssOverride={cardStyles.largeCard}>
                <CardContent cssOverride={cardStyles.largeContentPadded}>
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
                          gap={2}
                          wrap="wrap" rowGap={2}>
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

const styles = defineStyles({
  emptyState: {
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  },
  emptyStateText: {
    color: theme.colors.text.subdued,
  }
});
