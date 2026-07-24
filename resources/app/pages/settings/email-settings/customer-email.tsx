import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import GroupOptionCard from '@/components/group-option-card';
import OptionAccordion from '@/components/option-accordion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { CartIcon, PersonIcon, UserIcon } from '@/icons';
import type { EmailSettingsFormValues } from '@/schemas/forms/email-settings-form';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
      <Card css={styles.roundedCard}>
        <CardContent>

          <Flex direction="column" gap={16}>
            <Flex direction="column" style={{ alignItems: 'flex-start' }} gap={6}>
              <Flex gap={8} style={{ alignItems: 'center' }}>
                <PersonIcon />
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
        </CardContent>
      </Card>
    </div>
  );
};

CustomerEmail.displayName = 'CustomerEmail';

export default CustomerEmail;

const styles = {
  roundedCard: scoped({
    borderRadius: theme.radius.xl,
  }),
};
