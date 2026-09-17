import { Box } from 'lucide-react';
import { type Dispatch, type SetStateAction, useMemo } from 'react';
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
import {
  getShippingMethodRightText,
  getShippingMethodSubText,
  saveShippingZones,
  shippingMethodIconMap,
} from '@/features/settings/shipping/lib/utils';
import type { ShippingMethodData, ShippingZone } from '@/features/settings/shipping/types';
import { useBaseCurrencySymbol, useConfirmDelete } from '@/hooks';
import { EditPenIcon, TrashIcon } from '@/icons';
import type { ShippingSettings } from '@/schemas/catalog/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

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
  const baseCurrencySymbol = useBaseCurrencySymbol();

  const shippingMethodListWithIcon = useMemo(() => {
    return (shippingMethodList || []).map((method) => ({
      ...method,
      icon: shippingMethodIconMap[method.type] || null,
      subText: getShippingMethodSubText(method),
      rightText: getShippingMethodRightText(method, baseCurrencySymbol),
    }));
  }, [shippingMethodList, baseCurrencySymbol]);

  const { confirmDelete, deleteConfirmation } = useConfirmDelete();

  const handleDeleteMethodItem = (item: ShippingMethodData) => {
    confirmDelete(
      {
        title: __('Delete shipping method?', 'kirki-ecommerce'),
        description: __(
          'This method will be removed from the zone and will no longer be offered at checkout. This cannot be undone.',
          'kirki-ecommerce',
        ),
      },
      () => {
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

        void saveShippingZones({
          zones: updatedZones,
          shippingSettingsData,
          toastMessage: __('Shipping method deleted', 'kirki-ecommerce'),
        });
      },
    );
  };

  const handleEditDeliveryMethod = (item: ShippingMethodData) => {
    void navigate(
      `${ShippingRoutes.get('ShippingDeliveryMethod').buildLink()}?methodId=${item.id}&zoneId=${item.zoneId}`,
    );
  };

  const handleAddMethod = () => {
    if (zoneId !== undefined && zoneId !== null) {
      void navigate(`${ShippingRoutes.get('ShippingDeliveryMethod').buildLink()}?zoneId=${zoneId}`);
      return;
    }
    void navigate(ShippingRoutes.get('ShippingDeliveryMethod').buildLink());
  };

  return (
    <div>
      <Card data-search-skip="true" cssOverride={cardStyles.formCard}>
        <CardContent>
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
              data-search-skip="true"
              cssOverride={{ ...cardStyles.innerDarkCard, marginTop: theme.spacing[5] }}
            >
              <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyState)}>
                <Flex direction="column" gap={2} align="center">
                  <Box size={24} color={theme.colors.icon.disabled} />
                  <span css={scoped(styles.emptyStateText)}>
                    {__('Added shipping methods will appear here', 'kirki-ecommerce')}
                  </span>
                </Flex>
              </CardContent>
            </Card>
          ) : (
            <StackedItems cssOverride={{ marginTop: theme.spacing[5] }}>
              {shippingMethodListWithIcon.map((item) => (
                <StackedItem key={item.id} id={String(item.id)}>
                  {item.icon && (
                    <StackedItemMedia cssOverride={{ color: theme.colors.icon.disabled }}>
                      {item.icon}
                    </StackedItemMedia>
                  )}
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
                        <Badge variant="destructive">{__('Inactive', 'kirki-ecommerce')}</Badge>
                      )}
                    </StackedItemTitle>
                  </StackedItemContent>
                  <StackedItemActions>
                    <ActionGroup>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={__('Delete', 'kirki-ecommerce')}
                        cssOverride={mergeCss(styles.actionButton, {
                          '& svg': { color: theme.colors.icon.critical },
                        })}
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
      {deleteConfirmation}
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
