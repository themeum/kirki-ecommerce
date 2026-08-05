import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router';

import GroupOptionCard from '@/components/group-option-card';
import HeaderActionsCard from '@/components/header-actions-card';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { dispatchToastMessage } from '@/pages/utils';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import { getShippingMethodRightText, getShippingMethodSubText, saveShippingZones, shippingMethodIconMap, type ShippingMethodData, type ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { BoxIcon } from 'lucide-react';

type ShippingMethodProps = {
  shippingSettingsData: SettingsSectionData | null | undefined;
  shippingMethodList: ShippingMethodData[];
  setShippingZonesObj: Dispatch<SetStateAction<ShippingZone[]>>;
  shippingZonesObj: ShippingZone[];
  zoneId?: string | number | null;
};

export const ShippingMethod = ({
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
      subText: getShippingMethodSubText(method),
      rightText: getShippingMethodRightText(method),
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
      <Card cssOverride={cardStyles.formCard}>
        <CardContent >
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
            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyState)}>
                <Flex direction="column" gap={2} align="center">
                  <BoxIcon size={24} />
                  <span css={scoped(styles.emptyStateText)}>
                    {__(
                      'Added shipping methods will appear here',
                      'kirki-ecommerce',
                    )}
                  </span>
                </Flex>
              </CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

const styles = defineStyles({
  emptyState: {
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  },
  emptyStateText: {
    color: theme.colors.text.subdued,
  }
});
