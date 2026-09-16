import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import { RegionsDialog } from '@/components/regions-dialog';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { resolveTaxRegionStrategy } from '@/features/settings/tax/registry';
import type { TaxRegion } from '@/features/settings/tax/shared/lib/utils';
import type { TaxSettingsFormInput } from '@/features/settings/tax/shared/schemas/forms/tax-settings-form';
import type { SettingsOutletContext } from '@/features/settings/types';
import { EyeClosedIcon, EyeIcon, LocationIcon, TrashIcon } from '@/icons';
import type { Country } from '@/schemas/reference/country';
import type { Region, RegionsDialogFormPayload } from '@/schemas/shared/region';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';
import { Edit3 } from 'lucide-react';

type TaxRegionsProps = {
  handleSave: (updatedRegions?: TaxRegion[]) => void | Promise<void>;
};

const EU_REGION_CODE = 'EU';

const TaxRegions = (props: TaxRegionsProps) => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const { handleSave } = props;
  const { setValue, formState, control } = useFormContext<TaxSettingsFormInput>();
  const watchedTaxRegions = useWatch({ control, name: 'tax_regions' });
  const taxRegions = useMemo(() => (watchedTaxRegions ?? []) as TaxRegion[], [watchedTaxRegions]);

  const [showPopup, setShowPopup] = useState(false);

  const { data: countries = [] } = useCountriesQuery({ limit: -1 });

  const countryList = useMemo<Country[]>(() => {
    const euMembers = countries.filter((country) => country.group === 'eu');

    if (!euMembers.length) {
      return countries;
    }

    const euRegion: Country = {
      name: __('European Union', 'kirki-ecommerce'),
      code: EU_REGION_CODE,
      flag: '🇪🇺',
      states: euMembers.map((member) => ({
        id: member.name,
        name: member.name,
        code: member.code,
        flag: member.flag,
      })),
    };

    return [euRegion, ...countries.filter((country) => country.group !== 'eu')];
  }, [countries]);

  const disabledRegions = useMemo<Region[]>(
    () => taxRegions.map((region) => ({ country: region.code, states: [] })),
    [taxRegions],
  );

  const resolveRegionMeta = (region: TaxRegion) =>
    resolveTaxRegionStrategy(region.code).resolveMeta(region, countryList);

  const resolveRegionBadges = (region: TaxRegion) =>
    resolveTaxRegionStrategy(region.code).resolveBadges(region);

  const resolveRegionRateLabel = (region: TaxRegion) =>
    resolveTaxRegionStrategy(region.code).resolveRateLabel(region);

  const popupErrors = {
    ...(formState.errors.tax_regions?.message
      ? { regions: formState.errors.tax_regions.message }
      : {}),
  };

  const handleEditRegion = (item: TaxRegion) => {
    void navigate(resolveTaxRegionStrategy(item.code).buildEditLink(item));
  };

  const handleRegionAction = (action: string, item: TaxRegion) => {
    if (action === 'edit') {
      handleEditRegion(item);
      return;
    }

    if (action === 'toggle') {
      void handleToggleRegion(item);
      return;
    }

    confirmAction({
      action: () => handleDeleteRegion(item),
      otherProps: {
        variant: 'delete',
        force: true,
        title: __('Delete tax region?', 'kirki-ecommerce'),
        subtitle: __(
          'Are you sure you want to delete this region? This action cannot be undone.',
          'kirki-ecommerce',
        ),
      },
    });
  };

  const handleDeleteRegion = async (item: TaxRegion) => {
    const updatedRegions = (Array.isArray(taxRegions) ? taxRegions : []).filter(
      (region) => region?.code !== item?.code,
    );
    setValue('tax_regions', updatedRegions as TaxSettingsFormInput['tax_regions'], {
      shouldDirty: true,
    });
    await handleSave(updatedRegions);
  };

  const handleToggleRegion = async (item: TaxRegion) => {
    const updatedRegions = (Array.isArray(taxRegions) ? taxRegions : []).map((region) =>
      region.code === item.code ? { ...region, is_enabled: !region.is_enabled } : region,
    );

    setValue('tax_regions', updatedRegions as TaxSettingsFormInput['tax_regions'], {
      shouldDirty: true,
    });
    await handleSave(updatedRegions);
  };

  const handleAddRegion = async (values: RegionsDialogFormPayload) => {
    if (!values.regions.length) {
      return;
    }

    const updatedRegions: TaxRegion[] = values.regions.map((region) => {
      const country =
        countryList.find((item) => item.code === region.country) ??
        ({ code: region.country } as Country);

      return resolveTaxRegionStrategy(region.country).createRegion(country);
    });

    const existingCodes = new Set(taxRegions.map((r) => r.code));
    const filtered = updatedRegions.filter((r) => !existingCodes.has(r.code));
    const finalRegions = [...taxRegions, ...filtered];

    setValue('tax_regions', finalRegions as TaxSettingsFormInput['tax_regions'], {
      shouldDirty: true,
    });
    await handleSave(finalRegions);
    setShowPopup(false);
  };

  return (
    <>
      <Card
        data-search-id="tax.regions"
        data-search-keywords="vat, gst, jurisdiction, nexus, levy"
        cssOverride={cardStyles.formCard}
      >
        <CardContent>
          <HeaderActionsCard
            header={__('Tax Regions', 'kirki-ecommerce')}
            subHeader={__(
              'Places where you are registered to collect sales tax, matched by shopper address.',
              'kirki-ecommerce',
            )}
            buttonText={__('Add', 'kirki-ecommerce')}
            onAdd={() => setShowPopup(true)}
          />

          <div css={scoped({ marginTop: theme.spacing[5] })}>
            {!taxRegions.length ? (
              <Card>
                <CardContent
                  cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyStateContent)}
                >
                  <Flex direction="column" gap={2} align="center">
                    <LocationIcon />
                    <span css={scoped(styles.mutedText)}>
                      {__('Added tax zones will appear here', 'kirki-ecommerce')}
                    </span>
                  </Flex>
                </CardContent>
              </Card>
            ) : (
              <Flex direction="column" gap={2}>
                {taxRegions.map((item, index) => {
                  const region = resolveRegionMeta(item);
                  return (
                    <Card cssOverride={styles.regionCard} key={index}>
                      <CardContent cssOverride={styles.regionCardContent}>
                        <Flex gap={2} align="center">
                          <span>{region.flag}</span>
                          <Text weight="medium" color={!item?.is_enabled ? 'disabled' : 'primary'}>
                            {region.name}
                          </Text>
                          {resolveRegionBadges(item).map((badge) => (
                            <Badge key={badge.label} variant="info">
                              {badge.label}
                            </Badge>
                          ))}
                          {!item?.is_enabled && (
                            <Badge variant="destructive">{__('Inactive', 'kirki-ecommerce')}</Badge>
                          )}
                          <ActionGroup>
                            <Text variant="paragraph" color="primary">
                              {resolveRegionRateLabel(item)}
                            </Text>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={__('Edit', 'kirki-ecommerce')}
                              onClick={() => handleEditRegion(item)}
                            >
                              <Edit3 />
                            </Button>
                            <DropdownButton
                              buttonProps={{ direction: 'horizontal' }}
                              dropdownStyle={{ width: 140 }}
                              options={[
                                {
                                  title: item?.is_enabled
                                    ? __('Disable', 'kirki-ecommerce')
                                    : __('Enable', 'kirki-ecommerce'),
                                  value: 'toggle',
                                  icon: item?.is_enabled ? <EyeClosedIcon /> : <EyeIcon />,
                                },
                                {
                                  title: __('Delete', 'kirki-ecommerce'),
                                  value: 'delete',
                                  icon: <TrashIcon />,
                                  cssOverride: {
                                    '& svg': { color: theme.colors.icon.critical },
                                  },
                                },
                              ]}
                              onOptionSelect={(action) => handleRegionAction(String(action), item)}
                            />
                          </ActionGroup>
                        </Flex>
                      </CardContent>
                    </Card>
                  );
                })}
              </Flex>
            )}
          </div>
        </CardContent>
      </Card>
      <RegionsDialog
        open={showPopup}
        onOpenChange={setShowPopup}
        countries={countryList}
        countryOnly
        disabledRegions={disabledRegions}
        from="edit"
        dialogTitle={__('Add tax region', 'kirki-ecommerce')}
        onDone={handleAddRegion}
        errors={popupErrors}
      />
    </>
  );
};

TaxRegions.displayName = 'TaxRegions';

export default TaxRegions;

const styles = defineStyles({
  emptyStateContent: { padding: `${theme.spacing[9]} 0` },
  mutedText: {
    color: theme.colors.text.subdued,
  },
  regionCard: {
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    backgroundColor: theme.colors.background.fillHover,
    border: 'none',
    boxShadow: 'none',
  },
  regionCardContent: {
    padding: 0,
  },
});
