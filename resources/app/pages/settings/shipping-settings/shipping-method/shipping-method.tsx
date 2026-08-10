import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import { EditPenIcon, TrashIcon } from '@/icons';
import { dispatchToastMessage } from '@/pages/utils';
import type { ShippingSettings } from '@/schemas/catalog/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { getShippingMethodRightText, getShippingMethodSubText, saveShippingZones, shippingMethodIconMap, type ShippingMethodData, type ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { BoxIcon } from 'lucide-react';

const ShippingRoutes = RouteConfig.Settings.get('ShippingSettings');

type ShippingMethodProps = {
  shippingSettingsData: ShippingSettings | null | undefined;
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
      `${ShippingRoutes.get('ShippingDeliveryMethod').buildLink()}?methodId=${item.id}&zoneId=${item.zoneId}`,
    );
  };

  const handleAddMethod = () => {
    if (zoneId !== undefined && zoneId !== null) {
      navigate(`${ShippingRoutes.get('ShippingDeliveryMethod').buildLink()}?zoneId=${zoneId}`);
      return;
    }
    navigate(ShippingRoutes.get('ShippingDeliveryMethod').buildLink());
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
            <Card cssOverride={{ ...cardStyles.innerDarkCard, marginTop: theme.spacing[5] }}>
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
            <StackedItems cssOverride={{ marginTop: theme.spacing[5] }}>
              {shippingMethodListWithIcon.map((item) => (
                <StackedItem key={item.id} id={String(item.id)}>
                  {item.icon && <StackedItemMedia>{item.icon}</StackedItemMedia>}
                  <StackedItemContent>
                    <StackedItemTitle>
                      <Text variant="small" weight="medium">
                        {item.name ?? ''}
                      </Text>
                      {item.subText && (
                        <Text variant="tiny" color="subdued">
                          {item.subText}
                        </Text>
                      )}
                      {item.is_enabled === false && (
                        <Badge variant="destructive">
                          {__('Inactive', 'kirki-ecommerce')}
                        </Badge>
                      )}
                    </StackedItemTitle>
                  </StackedItemContent>
                  <StackedItemActions>
                    <ActionGroup>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={__('Delete', 'kirki-ecommerce')}
                        cssOverride={styles.actionButton}
                        onClick={() => handleDeleteMethodItem(item)}
                      >
                        <TrashIcon />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={__('Edit', 'kirki-ecommerce')}
                        cssOverride={styles.actionButton}
                        onClick={() => handleEditDeliveryMethod(item)}
                      >
                        <EditPenIcon />
                      </Button>
                    </ActionGroup>
                  </StackedItemActions>
                </StackedItem>
              ))}
            </StackedItems>
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
  },
  actionButton: {
    padding: theme.spacing[1],
  },
});
