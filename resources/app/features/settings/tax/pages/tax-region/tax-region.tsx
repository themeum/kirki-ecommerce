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
import { RouteConfig } from '@/config/route-config';
import type { TaxRegion } from '@/features/settings/tax/lib/utils';
import type { TaxSettingsFormInput } from '@/features/settings/tax/schemas/forms/tax-settings-form';
import { EditIcon, LocationIcon, TrashIcon } from '@/icons';
import type { Region, RegionsDialogFormPayload } from '@/schemas/shared/region';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

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
  const { setValue, formState } = useFormContext<TaxSettingsFormInput>();
  const taxRegions = (useWatch<TaxSettingsFormInput>({ name: 'tax_regions' }) as TaxRegion[]) || [];

  const [showPopup, setShowPopup] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { data: countryList = [] } = useCountriesQuery({ limit: -1 });

  const disabledRegions = useMemo<Region[]>(() => {
    const euMemberIds = countryList
      .filter((country) => country.group === 'eu')
      .map((country) => country.name);

    return taxRegions.map((region) => ({
      country: region.code,
      states:
        region.code === 'EU'
          ? euMemberIds
          : (countryList.find((country) => country.code === region.code)?.states ?? []).map(
              (state) => state.id,
            ),
    }));
  }, [countryList, taxRegions]);

  const popupErrors = {
    ...(formState.errors.tax_regions?.message
      ? { regions: formState.errors.tax_regions.message }
      : {}),
  };

  const handleEditAndDelete = (action: string, item: TaxRegion) => {
    if (action === 'edit') {
      if (item?.code === 'EU') {
        void navigate(RouteConfig.Settings.get('TaxSettings').get('EditRegionEU').buildLink());
      } else {
        void navigate(
          RouteConfig.Settings.get('TaxSettings')
            .get('EditTaxRegion')
            .buildLink({ code: item.code }),
        );
      }
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
      const isEU = region.country === 'EU';
      const country = countryList.find((item) => item.code === region.country);
      const stateSource = isEU
        ? countryList
            .filter((item) => item.group === 'eu')
            .map((item) => ({
              id: item.name,
              name: item.name,
              code: item.code,
              flag: item.flag,
            }))
        : (country?.states ?? []);

      return {
        code: region.country,
        name: isEU ? __('European Union', 'kirki-ecommerce') : (country?.name ?? region.country),
        is_enabled: true,
        states: region.states.map((stateId) => {
          const match = stateSource.find((state) => state.id === stateId);
          return {
            id: stateId,
            title: String(match?.name ?? stateId),
            flag: match?.flag ?? '',
            ...(isEU ? { code: match?.code } : {}),
          };
        }),
        type: isEU ? 'oss' : null,
        flag: region.flag ?? country?.flag ?? '',
        product_tax: [],
        shipping_tax: [],
        rules: [],
      };
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
                {taxRegions.map((item, index) => (
                  <Card cssOverride={cardStyles.innerCard} key={index}>
                    <CardContent cssOverride={cardStyles.innerContent}>
                      <Flex gap={2} align="flex-start">
                        <span>{item?.flag}</span>
                        <Flex direction="column" gap={1}>
                          <Flex gap={2} align="center">
                            <Text
                              weight="medium"
                              color={!item?.is_enabled ? 'disabled' : 'primary'}
                            >
                              {item?.name}
                            </Text>
                            {!item?.is_enabled && (
                              <Badge variant="destructive">
                                {__('Inactive', 'kirki-ecommerce')}
                              </Badge>
                            )}
                          </Flex>
                          <Text variant="small" color="secondary">
                            {item?.states?.length
                              ? /* translators: %d: number of states */
                                sprintf(
                                  _n(
                                    '%d state',
                                    '%d states',
                                    item.states.length,
                                    'kirki-ecommerce',
                                  ),
                                  item.states.length,
                                )
                              : __('Entire country', 'kirki-ecommerce')}
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
                ))}
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
