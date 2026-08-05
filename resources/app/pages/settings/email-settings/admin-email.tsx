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
import { CartIcon, EditPenIcon, InventoryBoxIcon, SettingsIcon, UserIcon } from '@/icons';
import type { EmailSettingsFormInput } from '@/schemas/forms/email-settings-form';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { mapEmailGroup } from '@/pages/settings/email-settings/utils';

type EmailListItem = {
  key: string;
  name?: string;
  is_enabled?: boolean;
  [key: string]: unknown;
};

type AdminEmailProps = {
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
            <EditPenIcon />
          </Button>
        </ActionGroup>
      </StackedItemActions>
    </StackedItem>
  );
};

const AdminEmail = (props: AdminEmailProps) => {
  const { handleToggleOrder, handleEditOrder } = props;
  const { control } = useFormContext<EmailSettingsFormInput>();
  const adminEmails = useWatch({ control, name: 'admin_emails' });

  const { orderEmails, inventoryEmails, userEmails } = useMemo(() => {
    if (!adminEmails) {
      return {
        orderEmails: [],
        inventoryEmails: [],
        userEmails: [],
      };
    }

    return {
      orderEmails: mapEmailGroup(
        adminEmails.order_notifications,
        'admin_order',
      ),
      inventoryEmails: mapEmailGroup(
        adminEmails.inventory_notifications,
        'admin_inventory',
      ),
      userEmails: mapEmailGroup(adminEmails.user_notifications, 'admin_user'),
    };
  }, [adminEmails]);

  return (
    <>
      <Card cssOverride={styles.roundedCard}>
        <CardContent>

          <Flex direction="column" gap={4}>
            <Flex direction="column" gap={2} align="flex-start">
              <Flex gap={2} align="center">
                <SettingsIcon />
                <Text weight="semibold">
                  {__('Admin Emails', 'kirki-ecommerce')}
                </Text>
              </Flex>
              <Text color="secondary">
                {__('Manage admin emails here', 'kirki-ecommerce')}
              </Text>
            </Flex>

            <OptionAccordion
              header={__('Order', 'kirki-ecommerce')}
              subHeader={__(
                "Get notified about updates on your customer's orders.",
                'kirki-ecommerce',
              )}
              leftIcon={<CartIcon />}
            >
              {orderEmails.length > 0 && (
                <StackedItems>
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
              header={__('Inventory', 'kirki-ecommerce')}
              subHeader={__(
                'Get notified about your inventory status',
                'kirki-ecommerce',
              )}
              leftIcon={<InventoryBoxIcon />}
            >
              {inventoryEmails.length > 0 && (
                <StackedItems>
                  {inventoryEmails.map((item) => (
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
                'Get notified about new user registration',
                'kirki-ecommerce',
              )}
              leftIcon={<UserIcon />}
            >
              {userEmails.length > 0 && (
                <StackedItems>
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
    </>
  );
};

AdminEmail.displayName = 'AdminEmail';

export default AdminEmail;

const styles = defineStyles({
  roundedCard: {
    borderRadius: theme.radius.xl,
  },
  actionButton: {
    padding: theme.spacing[1],
  },
});
