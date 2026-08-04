import { css } from '@emotion/react';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ToggleButton from '@/components/ui/toggle-button';
import { EditIcon, LocationIcon, ShowMoreIcon, TrashIcon } from '@/icons';
import type { TaxSettingsFormInput } from '@/schemas/forms/tax-settings-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { scoped, mergeCss, defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import TaxRegionPopup from '@/pages/settings/tax-settings/tax-region/tax-region-dialog';
import type { SelectedTaxRegionDraft, TaxRegion } from '@/pages/settings/tax-settings/utils';

type SettingsOutletContext = {
  confirmAction: (opts: {
    action: () => void;
    otherProps?: Record<string, unknown>;
  }) => void;
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
  const taxRegions =
    (useWatch<TaxSettingsFormInput>({ name: 'tax_regions' }) as TaxRegion[]) ||
    [];

  const [showPopup, setShowPopup] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<SelectedTaxRegionDraft[]>(
    [],
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const popupErrors = {
    ...(formState.errors.tax_regions?.message
      ? { 'data.tax_regions': formState.errors.tax_regions.message }
      : {}),
  };

  const handleEditAndDelete = (action: string, item: TaxRegion) => {
    if (action === 'edit') {
      if (item?.code === 'EU') {
        navigate(`/settings/tax/region/eu`);
      } else {
        navigate(`/settings/tax/region/${item?.code}`);
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
    const updatedRegions = (Array.isArray(taxRegions) ? taxRegions : []).map(
      (region) =>
        region.code === item.code
          ? { ...region, is_enabled: !region.is_enabled }
          : region,
    );

    setValue('tax_regions', updatedRegions as TaxSettingsFormInput['tax_regions'], {
      shouldDirty: true,
    });
    await handleSave(updatedRegions);
  };

  const handleAddRegion = async () => {
    if (!Array.isArray(selectedRegion) || !selectedRegion.length) {
      return;
    }

    const updatedRegions: TaxRegion[] = selectedRegion.map((region) => {
      const isEU = region.country === 'EU';
      return {
        code: region.id,
        name: isEU ? 'European Union' : region.country,
        is_enabled: region?.is_enabled || true,
        states: region?.states,
        type: isEU ? 'oss' : null,
        flag: region?.flag,
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
      <Card cssOverride={cardStyles.largeCard} >
        <CardContent cssOverride={cardStyles.largeContentPadded}>

          <HeaderActionsCard
            header={__('Tax Regions', 'kirki-ecommerce')}
            subHeader={__(
              'A shipping zone includes regions you ship to and available methods. Each shopper is matched to one zone based on their address.',
              'kirki-ecommerce',
            )}
            buttonText={__('Add Region', 'kirki-ecommerce')}
            onAdd={() => setShowPopup(true)}
          />

          {!taxRegions.length ? (
            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyStateContent)}>
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
                <Card cssOverride={mergeCss(cardStyles.innerCard, styles.regionCard)} key={index} >
                  <CardContent cssOverride={cardStyles.innerContent}>

                    <Flex gap={2} align="flex-start">
                      <span>{item?.flag}</span>
                      <Flex direction="column" gap={3}>
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
                          {`${item?.states.length} states`}
                        </Text>
                      </Flex>
                      <ActionGroup
                        cssOverride={mergeCss(hoverVisibleCss,
                          activeIndex === index && activeCardCss,)}
                      >
                        <ToggleButton
                          value={item?.is_enabled}
                          onChange={() => handleToggleRegion(item)}
                        />
                        <DropdownButton
                          buttonProps={{
                            size: 'small',
                            style: { transform: 'rotate(90deg)' },
                            icon: <ShowMoreIcon />,
                          }}
                          dropdownStyle={{ width: '115px' }}
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
                          onOptionSelect={(action) =>
                            handleEditAndDelete(String(action), item)
                          }
                        />
                      </ActionGroup>
                    </Flex>
                  </CardContent>

                </Card>

              ))}
            </Flex>
          )}
        </CardContent>
      </Card>
      {showPopup && (
        <TaxRegionPopup
          openPopup={showPopup}
          setOpenPopup={setShowPopup}
          regions={taxRegions}
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          onAdd={handleAddRegion}
          errors={popupErrors}
        />
      )}
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
  },
});
