import { css } from '@emotion/react';
import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import { RegionsDialog } from '@/components/regions-dialog';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { resolveTaxRegionStrategy } from '@/features/settings/tax/registry';
import type { TaxRegion } from '@/features/settings/tax/shared/lib/utils';
import type { TaxSettingsFormInput } from '@/features/settings/tax/shared/schemas/forms/tax-settings-form';
import { EditIcon, LocationIcon, TrashIcon } from '@/icons';
import type { Country } from '@/schemas/reference/country';
import type { Region, RegionsDialogFormPayload } from '@/schemas/shared/region';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SettingsOutletContext = {
  confirmAction: (opts: { action: () => void; otherProps?: Record<string, unknown> }) => void;
};

type TaxRegionsProps = {
  handleSave: (updatedRegions?: TaxRegion[]) => void | Promise<void>;
};

const hoverVisibleCss = css({
  visibility: 'hidden',
});

const activeCardCss = css({
  visibility: 'visible',
});

const TaxRegions = (props: TaxRegionsProps) => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const { handleSave } = props;
  const { setValue, formState, control } = useFormContext<TaxSettingsFormInput>();
  const watchedTaxRegions = useWatch({ control, name: 'tax_regions' });
  const taxRegions = useMemo(() => (watchedTaxRegions ?? []) as TaxRegion[], [watchedTaxRegions]);

  const [showPopup, setShowPopup] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { data: countryList = [] } = useCountriesQuery({ limit: -1 });

  const disabledRegions = useMemo<Region[]>(
    () => taxRegions.map((region) => ({ country: region.code, states: [] })),
    [taxRegions],
  );

  const resolveRegionMeta = (region: TaxRegion) =>
    resolveTaxRegionStrategy(region.code).resolveMeta(region, countryList);

  const resolveRegionSummary = (region: TaxRegion) =>
    resolveTaxRegionStrategy(region.code).resolveSummary(region);

  const popupErrors = {
    ...(formState.errors.tax_regions?.message
      ? { regions: formState.errors.tax_regions.message }
      : {}),
  };

  const handleEditAndDelete = (action: string, item: TaxRegion) => {
    if (action === 'edit') {
      void navigate(resolveTaxRegionStrategy(item.code).buildEditLink(item));
      return;
    } else {
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
    }
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
      <Card cssOverride={cardStyles.formCard}>
        <CardContent>
          <HeaderActionsCard
            header={__('Tax Regions', 'kirki-ecommerce')}
            subHeader={__(
              'Define tax regions where you collect sales tax. Each shopper is matched to one region based on their address.',
              'kirki-ecommerce',
            )}
            buttonText={__('Add Region', 'kirki-ecommerce')}
            onAdd={() => setShowPopup(true)}
          />

          <div css={scoped({ marginTop: theme.spacing[5] })}>
            {!taxRegions.length ? (
              <Card cssOverride={cardStyles.innerDarkCard}>
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
              <Flex direction="column" gap={3}>
                {taxRegions.map((item, index) => {
                  const region = resolveRegionMeta(item);

                  return (
                    <Card cssOverride={cardStyles.innerCard} key={index}>
                      <CardContent cssOverride={cardStyles.innerContent}>
                        <Flex gap={2} align="flex-start">
                          <span>{region.flag}</span>
                          <Flex direction="column" gap={1}>
                            <Flex gap={2} align="center">
                              <Text
                                weight="medium"
                                color={!item?.is_enabled ? 'disabled' : 'primary'}
                              >
                                {region.name}
                              </Text>
                              {!item?.is_enabled && (
                                <Badge variant="destructive">
                                  {__('Inactive', 'kirki-ecommerce')}
                                </Badge>
                              )}
                            </Flex>
                            <Text variant="small" color="secondary">
                              {resolveRegionSummary(item)}
                            </Text>
                          </Flex>
                          <ActionGroup
                            cssOverride={mergeCss(
                              hoverVisibleCss,
                              activeIndex === index && activeCardCss,
                            )}
                          >
                            <Switch
                              checked={Boolean(item?.is_enabled)}
                              onCheckedChange={() => handleToggleRegion(item)}
                            />
                            <DropdownButton
                              dropdownStyle={{ width: 120 }}
                              options={[
                                {
                                  title: __('Edit', 'kirki-ecommerce'),
                                  value: 'edit',
                                  icon: <EditIcon />,
                                },
                                {
                                  title: __('Delete', 'kirki-ecommerce'),
                                  value: 'delete',
                                  icon: <TrashIcon />,
                                },
                              ]}
                              onOptionToggle={(value) => {
                                if (value === true) {
                                  setActiveIndex(index);
                                } else {
                                  setActiveIndex(null);
                                }
                              }}
                              onOptionSelect={(action) => handleEditAndDelete(String(action), item)}
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
        enableEuropeanRegion
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
});
