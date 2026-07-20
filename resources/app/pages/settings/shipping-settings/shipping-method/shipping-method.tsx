import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router';

import Flex from '@/molecules/flex';
import { BoxOpenIcon } from '@/icons';
import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { dispatchToastMessage } from '@/pages/utils';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import {
  saveShippingZones,
  shippingMethodIconMap,
  type ShippingMethodData,
  type ShippingZone,
} from '@/pages/settings/shipping-settings/utils';

type ShippingMethodProps = {
  from?: string;
  shippingSettingsData: SettingsSectionData | null | undefined;
  shippingMethodList: ShippingMethodData[];
  setShippingZonesObj: Dispatch<SetStateAction<ShippingZone[]>>;
  shippingZonesObj: ShippingZone[];
  zoneId?: string | number | null;
};

export const ShippingMethod = ({
  from = '',
  shippingSettingsData,
  shippingMethodList,
  setShippingZonesObj,
  shippingZonesObj,
  zoneId = null,
}: ShippingMethodProps) => {
  const navigate = useNavigate();

  const shippingMethodListWithIcon = useMemo(() => {
    return (shippingMethodList || []).map((method) => ({
      ...method,
      icon: shippingMethodIconMap[method.type] || null,
    }));
  }, [shippingMethodList]);

  const handleDeleteMethodItem = (item: ShippingMethodData) => {
    const originalZones = [...shippingZonesObj];

    const updatedZones = shippingZonesObj.map((zone) => {
      if (!zone.shipping_methods?.some((m) => m.id === item.id)) {
        return zone;
      }
      return {
        ...zone,
        shipping_methods: zone.shipping_methods.filter((m) => m.id !== item.id),
      };
    });
    setShippingZonesObj(updatedZones);
    dispatchToastMessage('delete', {
      title: __('Shipping method deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setShippingZonesObj(originalZones);
      },
      onSuccess: async () => {
        await saveShippingZones({
          zones: updatedZones,
          from: 'delete',
          shippingSettingsData,
        });
      },
    });
  };

  const handleToggleMethodItem = async (item: ShippingMethodData) => {
    const updatedZones = shippingZonesObj.map((zone) => {
      if (!zone.shipping_methods?.some((m) => m.id === item.id)) {
        return zone;
      }
      return {
        ...zone,
        shipping_methods: zone.shipping_methods.map((m) =>
          m.id === item.id ? { ...m, is_enabled: !m.is_enabled } : m,
        ),
      };
    });

    setShippingZonesObj(updatedZones);
    await saveShippingZones({
      zones: updatedZones,
      from: 'edit',
      shippingSettingsData,
      toastMessage: __(
        'Shipping method active status updated',
        'kirki-ecommerce',
      ),
    });
  };

  const handleEditDeliveryMethod = (item: ShippingMethodData) => {
    navigate(
      `/settings/shipping/delivery-method?methodId=${item.id}&zoneId=${item.zoneId}`,
    );
  };

  const handleAddMethod = () => {
    if (zoneId !== undefined && zoneId !== null) {
      navigate(`/settings/shipping/delivery-method?zoneId=${zoneId}`);
      return;
    }
    navigate('/settings/shipping/delivery-method');
  };

  return (
    <div>
      {from === 'edit_zone' ? (
        <div style={{ marginTop: 'var(--decom-spacing-3)' }}>
          <GroupOptionCard
            dataArr={shippingMethodList}
            handleDeleteItem={(item) =>
              handleDeleteMethodItem(item as ShippingMethodData)
            }
            handleEditItem={(item) =>
              handleEditDeliveryMethod(item as ShippingMethodData)
            }
            handleToggleItem={(item) =>
              handleToggleMethodItem(item as ShippingMethodData)
            }
          />
        </div>
      ) : (
        <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
          <HeaderActionsCard
            header={__('Shipping Methods', 'kirki-ecommerce')}
            subHeader={__(
              'Used to create shipping rates for different product groups, like heavy items needing higher fees.',
              'kirki-ecommerce',
            )}
            buttonText={__('Add Method', 'kirki-ecommerce')}
            onAdd={handleAddMethod}
          />

          {!shippingMethodList?.length ? (
            <Card
              className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner-dark`}
              style={{
                padding: 'var(--decom-spacing-9) var(--decom-spacing-0)',
              }}
            >
              <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
                <BoxOpenIcon />
                <span style={{ color: 'var(--decom-text-text-subdued)' }}>
                  {__(
                    'Added shipping profiles will appear here',
                    'kirki-ecommerce',
                  )}
                </span>
              </Flex>
            </Card>
          ) : (
            <GroupOptionCard
              dataArr={shippingMethodListWithIcon}
              handleDeleteItem={(item) =>
                handleDeleteMethodItem(item as ShippingMethodData)
              }
              handleEditItem={(item) =>
                handleEditDeliveryMethod(item as ShippingMethodData)
              }
            />
          )}
        </Card>
      )}
    </div>
  );
};
