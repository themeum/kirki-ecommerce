import { useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import { LocationIcon, ShowMoreIcon, EditIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Badge from '@/molecules/badge';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import ToggleButton from '@/molecules/toggle-button';
import { CLASS_PREFIX } from '@/conf';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import type { SelectedTaxRegionDraft, TaxRegion } from '@/pages/settings/tax-settings/utils';
import TaxRegionPopup from '@/pages/settings/tax-settings/tax-region/tax-region-popup';

type SettingsOutletContext = {
  confirmAction: (opts: {
    action: () => void;
    otherProps?: Record<string, unknown>;
  }) => void;
};

type TaxRegionsProps = {
  taxRegions: TaxRegion[];
  setTaxRegions: Dispatch<SetStateAction<TaxRegion[]>>;
  handleSave: (updatedRegions?: TaxRegion[]) => void | Promise<void>;
  errors?: FormErrors;
};

const TaxRegions = (props: TaxRegionsProps) => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const { taxRegions, setTaxRegions, handleSave, errors } = props;
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<SelectedTaxRegionDraft[]>(
    [],
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
    setTaxRegions(updatedRegions);
    await handleSave(updatedRegions);
  };

  const handleToggleRegion = async (item: TaxRegion) => {
    const updatedRegions = (Array.isArray(taxRegions) ? taxRegions : []).map(
      (region) =>
        region.code === item.code
          ? { ...region, is_enabled: !region.is_enabled }
          : region,
    );

    setTaxRegions(updatedRegions);
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
    let finalRegions: TaxRegion[] = [];

    setTaxRegions((prev = []) => {
      const existingCodes = new Set(prev.map((r) => r.code));
      const filtered = updatedRegions.filter((r) => !existingCodes.has(r.code));
      finalRegions = [...prev, ...filtered];
      return finalRegions;
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
                type="inner"
                key={index}
                style={{
                  padding: 'var(--decom-spacing-3) var(--decom-spacing-4)',
                }}
                className={`${CLASS_PREFIX}-hover-parent`}
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
                    className={`${CLASS_PREFIX}-hover-visible ${
                      activeIndex === index ? `${CLASS_PREFIX}-active-card` : ''
                    }`}
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
                        value === true
                          ? setActiveIndex(index)
                          : setActiveIndex(null);
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
          errors={errors}
        />
      )}
    </>
  );
};

TaxRegions.displayName = 'TaxRegions';

export default TaxRegions;
