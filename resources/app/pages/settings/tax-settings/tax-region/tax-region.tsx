import { css } from '@emotion/react';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import { Card } from '@/components/ui/card';
import { LocationIcon, ShowMoreIcon, EditIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ToggleButton from '@/components/ui/toggle-button';
import type { TaxSettingsFormValues } from '@/schemas/forms/tax-settings-form';
import { __ } from '@/wpi18n';

import type { SelectedTaxRegionDraft, TaxRegion } from '@/pages/settings/tax-settings/utils';
import TaxRegionPopup from '@/pages/settings/tax-settings/tax-region/tax-region-dialog';

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
  const { setValue, formState } = useFormContext<TaxSettingsFormValues>();
  const taxRegions =
    (useWatch<TaxSettingsFormValues>({ name: 'tax_regions' }) as TaxRegion[]) ||
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
    setValue('tax_regions', updatedRegions as TaxSettingsFormValues['tax_regions'], {
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

    setValue('tax_regions', updatedRegions as TaxSettingsFormValues['tax_regions'], {
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

    setValue('tax_regions', finalRegions as TaxSettingsFormValues['tax_regions'], {
      shouldDirty: true,
    });
    await handleSave(finalRegions);
    setShowPopup(false);
  };

  return (
    <>
      <Card type="large">
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
          <Card type="innerDark" style={{ padding: '36px 0' }}>
            <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
              <LocationIcon />
              <span style={{ color: '#878593' }}>
                {__('Added tax zones will appear here', 'kirki-ecommerce')}
              </span>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" gap={12}>
            {taxRegions.map((item, index) => (
              <Card
                key={index}
                type="inner"
                style={{
                  padding: 'var(--decom-spacing-3) var(--decom-spacing-4)',
                }}
              >
                <Flex style={{ alignItems: 'flex-start' }} gap={8}>
                  <span>{item?.flag}</span>
                  <Text
                    header={item?.name}
                    subHeader={`${item?.states.length} states`}
                    gap={12}
                    badge={
                      !item?.is_enabled && (
                        <Badge text={__('Inactive', 'kirki-ecommerce')} type="trashed" />
                      )
                    }
                    type={!item?.is_enabled ? 'disabled' : 'secondary'}
                  />
                  <ActionGroup
                    css={css(
                      hoverVisibleCss,
                      activeIndex === index && activeCardCss,
                    )}
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
              </Card>
            ))}
          </Flex>
        )}
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
