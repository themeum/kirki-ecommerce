import { Edit3, InfoIcon, User2 } from 'lucide-react';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import OptionAccordion from '@/components/option-accordion';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import {
  type EmailListItem,
  getNotificationTemplateLabel,
  mapEmailGroup,
  resolveNotificationTemplate,
} from '@/features/settings/email/lib/utils';
import type { EmailSettingsFormInput } from '@/features/settings/email/schemas/forms/email-settings-form';
import { CartIcon, UserIcon } from '@/icons/common';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type CustomerEmailProps = {
  handleToggleOrder: (item: EmailListItem) => void;
  handleEditOrder: (item: EmailListItem) => void;
};

type EmailRowProps = {
  item: EmailListItem;
  label: string;
  onToggle: (item: EmailListItem) => void;
  onEdit: (item: EmailListItem) => void;
};

const EmailRow = (props: EmailRowProps) => {
  const { item, label, onToggle, onEdit } = props;

  return (
    <StackedItem id={item.key} cssOverride={styles.notificationRow}>
      <StackedItemContent>
        <StackedItemTitle>
          <Text variant="small" weight="medium">
            {label}
          </Text>
          {!item.is_enabled && (
            <Badge variant="destructive">{__('Inactive', 'kirki-ecommerce')}</Badge>
          )}
        </StackedItemTitle>
      </StackedItemContent>
      <StackedItemActions>
        <ActionGroup>
          <Switch checked={Boolean(item.is_enabled)} onCheckedChange={() => onToggle(item)} />
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={__('Edit', 'kirki-ecommerce')}
            cssOverride={styles.actionButton}
            onClick={() => onEdit(item)}
          >
            <Edit3 />
          </Button>
        </ActionGroup>
      </StackedItemActions>
    </StackedItem>
  );
};

const CustomerEmail = (props: CustomerEmailProps) => {
  const { handleToggleOrder, handleEditOrder } = props;
  const { control } = useFormContext<EmailSettingsFormInput>();
  const customerEmails = useWatch({ control, name: 'customer_emails' });

  const { orderEmails, userEmails } = useMemo(() => {
    if (!customerEmails) {
      return {
        orderEmails: [],
        userEmails: [],
      };
    }

    return {
      orderEmails: mapEmailGroup(customerEmails.order_notifications, 'customer_order'),
      userEmails: mapEmailGroup(customerEmails.user_notifications, 'customer_user'),
    };
  }, [customerEmails]);

  return (
    <div>
      <Card
        data-search-id="email.customer-emails"
        data-search-keywords="notification, transactional, receipt, confirmation"
        cssOverride={styles.roundedCard}
      >
        <CardContent>
          <Flex direction="column" gap={4}>
            <Flex direction="column" gap={2} align="flex-start">
              <Flex gap={2} align="center">
                <User2 size={16} />
                <Text weight="semibold">{__('Customer Emails', 'kirki-ecommerce')}</Text>
              </Flex>
              <Text color="secondary">
                {__(
                  'Order confirmation and registration messages sent to your shoppers.',
                  'kirki-ecommerce',
                )}
              </Text>
            </Flex>
            <Flex direction="column" gap={2}>
              <OptionAccordion
                header={__('Order', 'kirki-ecommerce')}
                leftIcon={<CartIcon />}
                tooltip={
                  <Tooltip tip={__('Customers get updates about their orders.', 'kirki-ecommerce')}>
                    <InfoIcon size={14} />
                  </Tooltip>
                }
                variant="email"
              >
                {orderEmails.length > 0 && (
                  <StackedItems cssOverride={styles.notificationStack}>
                    {orderEmails.map((item) => (
                      <EmailRow
                        key={item.key}
                        item={item}
                        label={getNotificationTemplateLabel(
                          resolveNotificationTemplate(item, 'customer_order'),
                        )}
                        onToggle={handleToggleOrder}
                        onEdit={handleEditOrder}
                      />
                    ))}
                  </StackedItems>
                )}
              </OptionAccordion>
              <OptionAccordion
                header={__('User', 'kirki-ecommerce')}
                leftIcon={<UserIcon />}
                tooltip={
                  <Tooltip
                    tip={__('Customers get updates regarding registration.', 'kirki-ecommerce')}
                  >
                    <InfoIcon size={14} />
                  </Tooltip>
                }
                variant="email"
              >
                {userEmails.length > 0 && (
                  <StackedItems cssOverride={styles.notificationStack}>
                    {userEmails.map((item) => (
                      <EmailRow
                        key={item.key}
                        item={item}
                        label={getNotificationTemplateLabel(
                          resolveNotificationTemplate(item, 'customer_user'),
                        )}
                        onToggle={handleToggleOrder}
                        onEdit={handleEditOrder}
                      />
                    ))}
                  </StackedItems>
                )}
              </OptionAccordion>
            </Flex>
          </Flex>
        </CardContent>
      </Card>
    </div>
  );
};

CustomerEmail.displayName = 'CustomerEmail';

export default CustomerEmail;

const styles = defineStyles({
  roundedCard: {
    borderRadius: theme.radius.xl,
  },
  actionButton: {
    padding: theme.spacing[1],
  },
  notificationStack: {
    border: 'none',
    borderRadius: theme.radius.none,
  },
  notificationRow: {
    paddingInline: `12px`,
    '& button[role="switch"]': {
      width: '36px',
      height: '20px',
    },
  },
});
