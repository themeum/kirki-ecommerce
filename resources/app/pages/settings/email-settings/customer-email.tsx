import { useMemo } from 'react';

import GroupOptionCard from '@/components/group-option-card';
import OptionAccordion from '@/components/option-accordion';
import { PersonIcon, CartIcon, UserIcon } from '@/icons';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { __ } from '@/wpi18n';

import { mapEmailGroup } from '@/pages/settings/email-settings/utils';

type EmailGroupData = {
  order_notifications?: Record<string, { name?: string; is_enabled?: boolean; [key: string]: unknown }>;
  user_notifications?: Record<string, { name?: string; is_enabled?: boolean; [key: string]: unknown }>;
};

type EmailListItem = {
  key: string;
  name?: string;
  is_enabled?: boolean;
  [key: string]: unknown;
};

type CustomerEmailProps = {
  customerEmails?: EmailGroupData;
  handleToggleOrder: (item: EmailListItem) => void;
  handleEditOrder: (item: EmailListItem) => void;
};

const CustomerEmail = (props: CustomerEmailProps) => {
  const { customerEmails, handleToggleOrder, handleEditOrder } = props;

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
      <Card style={{ borderRadius: '12px' }}>
        <Flex direction="column" gap={16}>
          <Flex direction="column" style={{ alignItems: 'flex-start' }} gap={6}>
            <Text
              header={__('Customer Emails', 'kirki-ecommerce')}
              type="primary"
              style={{ gap: '6px' }}
              leftIcon={<PersonIcon />}
            />
            <Text
              subHeader={__('Manage customer emails here', 'kirki-ecommerce')}
            />
          </Flex>

          <OptionAccordion
            header={__('Order', 'kirki-ecommerce')}
            subHeader={__(
              'Customers get updates about their orders.',
              'kirki-ecommerce',
            )}
            leftIcon={<CartIcon />}
          >
            <GroupOptionCard
              handleToggleItem={(item) =>
                handleToggleOrder(item as EmailListItem)
              }
              handleEditItem={(item) => handleEditOrder(item as EmailListItem)}
              dataArr={orderEmails}
            />
          </OptionAccordion>
          <OptionAccordion
            header={__('User', 'kirki-ecommerce')}
            subHeader={__(
              'Customers get updates regarding registration.',
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
    </div>
  );
};

export default CustomerEmail;
