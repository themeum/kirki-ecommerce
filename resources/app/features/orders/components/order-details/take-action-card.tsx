import { useState } from 'react';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Text from '@/components/ui/text';
import AddTrackingDialog from '@/features/orders/components/order-details/add-tracking-dialog';
import TrackingInfo from '@/features/orders/components/order-details/tracking-info';
import { useOrderAction } from '@/features/orders/hooks/use-order-action';
import { useOrderDetails } from '@/features/orders/hooks/use-order-details';
import {
  FULFILLMENT_ACTION_GROUP,
  getActionLabel,
  getAvailableActions,
  ORDER_ACTIONS,
  type OrderAction,
} from '@/features/orders/lib/order-actions';
import { getOrderStateBadgeInfo } from '@/features/orders/lib/order-badge';
import { isTrackingNumberAdded } from '@/features/orders/lib/shipping-tracking';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const TakeActionCard = () => {
  const [selectedAction, setSelectedAction] = useState<OrderAction | null>(null);
  const { handleAction, isActionPending, isTrackingDialogOpen } = useOrderAction();
  const { order } = useOrderDetails();

  if (!isDefined(order)) {
    return null;
  }
  const availableActions = getAvailableActions(order, FULFILLMENT_ACTION_GROUP);
  const orderState = getOrderStateBadgeInfo(order);
  const isTrackingAvailable = order.fulfillment_status === 'shipped' && order.shipping_method_type !== 'local_pickup';

  const handleUpdate = () => {
    if (!selectedAction) {
      return;
    }

    handleAction(selectedAction);

    if (selectedAction !== ORDER_ACTIONS.ADD_TRACKING) {
      setSelectedAction(null);
    }
  };

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardContent>
        <Flex direction="column" gap={4}>
          <Flex justify="space-between" align="center">
            <Flex gap={1} align="center">
              {orderState.icon}
              <Text variant="tiny" color={orderState.textColor}>
                {orderState.text}
              </Text>
            </Flex>
            <Text variant="tiny" color="subdued">
              {orderState.hintText}
            </Text>
          </Flex>

          {isTrackingNumberAdded(order.shipping_tracking) ? (
            <TrackingInfo
              orderId={order.id}
              tracking={order.shipping_tracking}
              onEdit={() => handleAction(ORDER_ACTIONS.ADD_TRACKING)}
            />
          ) : (
            isTrackingAvailable && (
              <Flex
                justify="space-between"
                align="center"
                cssOverride={{
                  backgroundColor: theme.colors.background.surfaceAlt,
                  padding: theme.spacing[2],
                  borderRadius: theme.radius.lg,
                }}
              >
                <Text variant="heading6" weight="normal" color="subdued">
                  {__('No tracking added', 'kirki-ecommerce')}
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(ORDER_ACTIONS.ADD_TRACKING)}
                >
                  {__('Add tracking', 'kirki-ecommerce')}
                </Button>
              </Flex>
            )
          )}
          {availableActions.length > 0 && (
            <Flex direction="column" gap={2}>
              <Field>
                <FieldLabel>
                  <Text variant="small" weight="medium">
                    {__('Take an Action', 'kirki-ecommerce')}
                  </Text>
                </FieldLabel>
                <Select
                  value={selectedAction ?? ''}
                  onValueChange={(value) => setSelectedAction(value as OrderAction)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={__('Select an option', 'kirki-ecommerce')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {getActionLabel(action, order)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Button
                variant="primary"
                style={{ width: '100%' }}
                disabled={!selectedAction}
                loading={isActionPending}
                onClick={handleUpdate}
              >
                <Text variant="tiny" weight="medium" color="light">
                  {__('Update', 'kirki-ecommerce')}
                </Text>
              </Button>
            </Flex>
          )}
        </Flex>
        {isTrackingDialogOpen && <AddTrackingDialog />}
      </CardContent>
    </Card>
  );
};

TakeActionCard.displayName = 'TakeActionCard';

export default TakeActionCard;
