import { useMemo } from 'react';

import GroupOptionCard from '@/components/group-option-card';
import OptionAccordion from '@/components/option-accordion';
import { SettingsIcon, CartIcon, InventoryBoxIcon, UserIcon } from '@/icons';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { __ } from '@/wpi18n';

import { mapEmailGroup } from '@/pages/settings/email-settings/utils';

type EmailGroupData = {
  order_notifications?: Record<string, { name?: string; is_enabled?: boolean; [key: string]: unknown }>;
  user_notifications?: Record<string, { name?: string; is_enabled?: boolean; [key: string]: unknown }>;
  inventory_notifications?: Record<string, { name?: string; is_enabled?: boolean; [key: string]: unknown }>;
};

type EmailListItem = {
  key: string;
  name?: string;
  is_enabled?: boolean;
  [key: string]: unknown;
};

type AdminEmailProps = {
  adminEmails?: EmailGroupData;
  handleToggleOrder: (item: EmailListItem) => void;
  handleEditOrder: (item: EmailListItem) => void;
};

const AdminEmail = (props: AdminEmailProps) => {
  const { adminEmails, handleToggleOrder, handleEditOrder } = props;

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
      <Card style={{ borderRadius: '12px' }}>
        <Flex direction="column" gap={16}>
          <Flex direction="column" style={{ alignItems: 'flex-start' }} gap={6}>
            <Text
              header={__('Admin Emails', 'kirki-ecommerce')}
              type="primary"
              style={{ gap: '6px' }}
              leftIcon={<SettingsIcon />}
            />
            <Text
              subHeader={__('Manage admin emails here', 'kirki-ecommerce')}
            />
          </Flex>

          <OptionAccordion
            header={__('Order', 'kirki-ecommerce')}
            subHeader={__(
              "Get notified about updates on your customer's orders.",
              'kirki-ecommerce',
            )}
            leftIcon={<CartIcon />}
          >
            <GroupOptionCard
              dataArr={orderEmails}
              handleToggleItem={(item) =>
                handleToggleOrder(item as EmailListItem)
              }
              handleEditItem={(item) => handleEditOrder(item as EmailListItem)}
            />
          </OptionAccordion>
          <OptionAccordion
            header={__('Inventory', 'kirki-ecommerce')}
            subHeader={__(
              'Get notified about your inventory status',
              'kirki-ecommerce',
            )}
            leftIcon={<InventoryBoxIcon />}
          >
            <GroupOptionCard
              dataArr={inventoryEmails}
              handleToggleItem={(item) =>
                handleToggleOrder(item as EmailListItem)
              }
              handleEditItem={(item) => handleEditOrder(item as EmailListItem)}
            />
          </OptionAccordion>
          <OptionAccordion
            header={__('User', 'kirki-ecommerce')}
            subHeader={__(
              'Get notified about new user registration',
              'kirki-ecommerce',
            )}
            leftIcon={<UserIcon />}
          >
            <GroupOptionCard
              dataArr={userEmails}
              handleToggleItem={(item) =>
                handleToggleOrder(item as EmailListItem)
              }
              handleEditItem={(item) => handleEditOrder(item as EmailListItem)}
            />
          </OptionAccordion>
        </Flex>
      </Card>
    </>
  );
};

export default AdminEmail;
