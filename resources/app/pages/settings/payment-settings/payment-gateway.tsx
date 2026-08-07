import { useState } from 'react';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { ShowMoreIcon } from '@/icons';
import { dispatchToastMessage } from '@/pages/utils';
import { getPaymentGateway, useSetEnabledPaymentGatewayMutation } from '@/services/payment';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import type { PaymentGateway } from '@/types';
import { __ } from '@/wpi18n';

import Switch from '@/components/ui/switch';
import PaymentGatewayPopup from '@/pages/settings/payment-settings/payment-gateway-dialog';
import PaymentGatewayEditPopup from '@/pages/settings/payment-settings/payment-gateway-edit-dialog';
import { CardSimIcon } from 'lucide-react';

type PaymentGatewayProps = {
  paymentGatewayList: PaymentGateway[];
};

const PaymentGatewayComponent = (props: PaymentGatewayProps) => {
  const { paymentGatewayList } = props;

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<PaymentGateway | null>(null);
  const [openPopup, setOpenPopup] = useState(false);

  const { mutate: setEnabledGateway } = useSetEnabledPaymentGatewayMutation();

  const handleToggleMethod = (item: PaymentGateway) => {
    if (item.id === undefined) {
      return;
    }
    const isEnabled = Boolean(item?.is_enabled);

    setEnabledGateway(
      { id: item.id, data: { is_enabled: !isEnabled } },
      {
        onError: () => {
          dispatchToastMessage('error', {
            title: __('Something went wrong', 'kirki-ecommerce'),
          });
        },
      },
    );
  };

  const handleAction = async (
    action: string | number | Array<string | number>,
    item: PaymentGateway,
  ) => {
    if (action === 'delete') {
      dispatchToastMessage('delete', {
        title: __('Payment gateway deleted', 'kirki-ecommerce'),
        duration: 5000,
        onSuccess: async () => { },
      });
      return;
    }

    if (action === 'edit' && item.id !== undefined) {
      const result = await getPaymentGateway(item.id);

      if (result) {
        setEditedItem(result);
        setOpenPopup(true);
      }
    }
  };

  return (
    <>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent >
          <Flex direction="column" gap={4}>
            <HeaderActionsCard
              header={__('Payment gateways', 'kirki-ecommerce')}
              subHeader={__(
                "Set up and manage your online store's payment options.",
                'kirki-ecommerce',
              )}
              buttonText={__('Add Payment Methods', 'kirki-ecommerce')}
              onAdd={() => setIsEditPopupOpen(true)}
            />

            {paymentGatewayList.length === 0 ? (
              <Card cssOverride={cardStyles.innerDarkCard}>
                <CardContent
                  cssOverride={mergeCss(
                    cardStyles.innerDarkContent,
                    styles.emptyStateContent,
                  )}
                >
                  <Flex direction="column" gap={2} align="center">
                    <CardSimIcon />
                    <Text color="subdued">
                      {__('No payment added yet', 'kirki-ecommerce')}
                    </Text>
                  </Flex>
                </CardContent>
              </Card>
            ) : (
              <Flex direction="column" gap={3}>
                {paymentGatewayList.map((item) => (
                  <Card key={item.id} cssOverride={cardStyles.innerCard}>
                    <CardContent
                      cssOverride={mergeCss(
                        cardStyles.innerContent,
                        styles.gatewayContent,
                      )}
                    >
                      <Flex align="center">
                        <Flex gap={2} align="center">
                          {item.icon && <img src={item.icon} alt="gateway-icon" css={scoped(styles.icon)} />}
                          <Text
                            weight="medium"
                            color={!item?.is_enabled ? 'disabled' : 'primary'}
                          >
                            {item?.name}
                          </Text>
                          {!item?.is_enabled && (
                            <Badge variant="destructive">
                              {__('Inactive', 'kirki-ecommerce')}
                            </Badge>
                          )}
                        </Flex>

                        <ActionGroup>
                          <Switch checked={Boolean(item?.is_enabled)} onCheckedChange={() => handleToggleMethod(item)} />
                          <DropdownButton
                            dropdownStyle={{ width: '115px' }}
                            buttonProps={{
                              size: 'small',
                              style: { transform: 'rotate(90deg)' },
                              icon: <ShowMoreIcon />,
                            }}
                            options={[
                              {
                                title: __('Edit', 'kirki-ecommerce'),
                                value: 'edit',
                              },
                              {
                                title: __('Delete', 'kirki-ecommerce'),
                                value: 'delete',
                              },
                            ]}
                            onOptionSelect={(action) => handleAction(action, item)}
                          />
                        </ActionGroup>
                      </Flex>
                    </CardContent>
                  </Card>
                ))}
              </Flex>
            )}
          </Flex>
        </CardContent>
      </Card>

      <PaymentGatewayEditPopup
        editedItem={editedItem}
        isOpen={openPopup}
        onClose={() => setOpenPopup(false)}
      />

      {isEditPopupOpen && (
        <PaymentGatewayPopup
          openPopup={isEditPopupOpen}
          setOpenPopup={setIsEditPopupOpen}
        />
      )}
    </>
  );
};

PaymentGatewayComponent.displayName = 'PaymentGatewayComponent';

export default PaymentGatewayComponent;

const styles = defineStyles({
  gatewayContent: {
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  },
  emptyStateContent: {
    paddingBlock: theme.spacing[9],
  },
  icon: {
    height: 20,
    width: 'auto',
    objectFit: 'contain',
  }
});
