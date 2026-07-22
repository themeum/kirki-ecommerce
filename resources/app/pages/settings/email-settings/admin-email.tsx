import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import GroupOptionCard from '@/components/group-option-card';
import OptionAccordion from '@/components/option-accordion';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { SettingsIcon, CartIcon, InventoryBoxIcon, UserIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { EmailSettingsFormValues } from '@/schemas/forms/email-settings-form';
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

const AdminEmail = (props: AdminEmailProps) => {
  const { handleToggleOrder, handleEditOrder } = props;
  const { control } = useFormContext<EmailSettingsFormValues>();
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
      <Card
        className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-default`}
        style={{ borderRadius: '12px' }}
      >
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

AdminEmail.displayName = 'AdminEmail';

export default AdminEmail;
