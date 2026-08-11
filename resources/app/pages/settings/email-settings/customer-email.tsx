import { Edit3, User2 } from 'lucide-react';
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
import { CartIcon, UserIcon } from '@/icons';
import { mapEmailGroup } from '@/pages/settings/email-settings/utils';
import type { EmailSettingsFormInput } from '@/schemas/forms/email-settings-form';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type EmailListItem = {
  key: string;
  name?: string;
  is_enabled?: boolean;
  [key: string]: unknown;
};

type CustomerEmailProps = {
  handleToggleOrder: (item: EmailListItem) => void;
  handleEditOrder: (item: EmailListItem) => void;
};

type EmailRowProps = {
  item: EmailListItem;
  onToggle: (item: EmailListItem) => void;
  onEdit: (item: EmailListItem) => void;
};

const EmailRow = (props: EmailRowProps) => {
  const { item, onToggle, onEdit } = props;

  return (
    <StackedItem id={item.key}>
      <StackedItemContent>
        <StackedItemTitle>
          <Text variant="small" weight="medium">
            {item.name ?? ''}
          </Text>
          {item.is_enabled === false && (
            <Badge variant="destructive">
              {__('Inactive', 'kirki-ecommerce')}
            </Badge>
          )}
        </StackedItemTitle>
      </StackedItemContent>
      <StackedItemActions>
        <ActionGroup>
          <Switch
            checked={Boolean(item.is_enabled)}
            onCheckedChange={() => onToggle(item)}
          />
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
      orderEmails: mapEmailGroup(
        customerEmails.order_notifications,
        'customer_order',
      ),
      userEmails: mapEmailGroup(
        customerEmails.user_notifications,
        'customer_user',
      ),
    };
  }, [customerEmails]);

  return (
    <div>
      <Card cssOverride={styles.roundedCard}>
        <CardContent>

          <Flex direction="column" gap={4}>
            <Flex direction="column" gap={2} align="flex-start">
              <Flex gap={2} align="center">
                <User2 size={16} />
                <Text weight="semibold">{__('Customer Emails', 'kirki-ecommerce')}</Text>
              </Flex>
              <Text color="secondary">{__('Manage customer emails here', 'kirki-ecommerce')}</Text>
            </Flex>

            <OptionAccordion
              header={__('Order', 'kirki-ecommerce')}
              subHeader={__(
                'Customers get updates about their orders.',
                'kirki-ecommerce',
              )}
              leftIcon={<CartIcon />}
            >
              {orderEmails.length > 0 && (
                <StackedItems variant="card">
                  {orderEmails.map((item) => (
                    <EmailRow
                      key={item.key}
                      item={item}
                      onToggle={handleToggleOrder}
                      onEdit={handleEditOrder}
                    />
                  ))}
                </StackedItems>
              )}
            </OptionAccordion>
            <OptionAccordion
              header={__('User', 'kirki-ecommerce')}
              subHeader={__(
                'Customers get updates regarding registration.',
                'kirki-ecommerce',
              )}
              leftIcon={<UserIcon />}
            >
              {userEmails.length > 0 && (
                <StackedItems variant="card">
                  {userEmails.map((item) => (
                    <EmailRow
                      key={item.key}
                      item={item}
                      onToggle={handleToggleOrder}
                      onEdit={handleEditOrder}
                    />
                  ))}
                </StackedItems>
              )}
            </OptionAccordion>
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
});
