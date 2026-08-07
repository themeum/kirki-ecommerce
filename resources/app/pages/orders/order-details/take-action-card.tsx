import { useState } from 'react';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Text from '@/components/ui/text';
import {
  FULFILLMENT_ACTION_GROUP,
  getActionLabel,
  getAvailableActions,
  ORDER_ACTIONS,
  type OrderAction,
} from '@/pages/orders/order-details/config/order-actions';
import { getFulfillmentBadgeInfo, getFulfillmentHint } from '@/pages/orders/order-details/config/order-badge';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import type { OrderItem } from '@/types';
import { __ } from '@/wpi18n';

type TakeActionCardProps = {
  order: OrderItem;
  onAction: (action: OrderAction) => void;
  isPerforming?: boolean;
};

const TakeActionCard = ({ order, onAction, isPerforming }: TakeActionCardProps) => {
  const [selectedAction, setSelectedAction] = useState<OrderAction | ''>('');

  const availableActions = getAvailableActions(order, FULFILLMENT_ACTION_GROUP);
  const fulfillmentBadge = getFulfillmentBadgeInfo(order.fulfillment_status);

  const handleUpdate = () => {
    if (!selectedAction) {
      return;
    }

    onAction(selectedAction);

    if (selectedAction !== ORDER_ACTIONS.ADD_TRACKING) {
      setSelectedAction('');
    }
  };

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardContent>
        <Flex direction="column" gap={4}>
          <Flex justify="space-between" align="center">
            <Flex gap={2} align="center">
              <span css={scoped(styles.statusDot)} />
              <Text variant="tiny">{fulfillmentBadge.text}</Text>
            </Flex>
            <Text variant="tiny" color="secondary">
              {getFulfillmentHint(order.fulfillment_status)}
            </Text>
          </Flex>

          {availableActions.length > 0 && (
            <Flex direction='column' gap={4}>
              <Field>
                <FieldLabel><Text variant="small" weight="medium">{__('Take an Action', 'kirki-ecommerce')}</Text></FieldLabel>
                <Select
                  value={selectedAction}
                  onValueChange={(value) => setSelectedAction(value as OrderAction)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={__('Select an option', 'kirki-ecommerce')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {getActionLabel(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Button
                variant="primary"
                style={{ width: '100%' }}
                disabled={!selectedAction}
                loading={isPerforming}
                onClick={handleUpdate}
              >
                <Text variant="tiny" weight="medium">{__('Update', 'kirki-ecommerce')}</Text>
              </Button>
            </Flex>
          )}
        </Flex>
      </CardContent>
    </Card>
  );
};

TakeActionCard.displayName = 'TakeActionCard';

export default TakeActionCard;

const styles = defineStyles({
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.fillBrand,
    flexShrink: 0,
  },
});
