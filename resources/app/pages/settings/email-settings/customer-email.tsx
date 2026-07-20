import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import GroupOptionCard from '@/components/group-option-card';
import OptionAccordion from '@/components/option-accordion';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { PersonIcon, CartIcon, UserIcon } from '@/icons';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import type { EmailSettingsFormValues } from '@/schemas/forms/email-settings-form';
import { __ } from '@/wpi18n';

import { mapEmailGroup } from '@/pages/settings/email-settings/utils';

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

const CustomerEmail = (props: CustomerEmailProps) => {
  const { handleToggleOrder, handleEditOrder } = props;
  const { control } = useFormContext<EmailSettingsFormValues>();
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
      <Card
        className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-default`}
        style={{ borderRadius: '12px' }}
      >
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

CustomerEmail.displayName = 'CustomerEmail';

export default CustomerEmail;
