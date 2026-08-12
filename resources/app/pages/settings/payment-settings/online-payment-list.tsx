import { CardSimIcon } from 'lucide-react';
import { useState } from 'react';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { ShowMoreIcon } from '@/icons';
import OnlinePaymentPopup from '@/pages/settings/payment-settings/online-payment-dialog';
import OnlinePaymentEditPopup from '@/pages/settings/payment-settings/online-payment-edit-dialog';
import type { OnlinePayment } from '@/schemas/catalog/payment';
import { getOnlinePayment, useSetEnabledOnlinePaymentMutation } from '@/services/payment';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { dispatchToastMessage } from '@/utils/common';
import { __ } from '@/wpi18n';

type OnlinePaymentProps = {
  onlinePaymentList: OnlinePayment[];
};

const OnlinePaymentList = (props: OnlinePaymentProps) => {
  const { onlinePaymentList } = props;

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<OnlinePayment | null>(null);
  const [openPopup, setOpenPopup] = useState(false);

  const { mutate: setEnabledOnlinePayment } = useSetEnabledOnlinePaymentMutation();

  const handleToggleOnlinePayment = (item: OnlinePayment) => {
    if (item.id === undefined) {
      return;
    }
    const isEnabled = Boolean(item?.is_enabled);

    setEnabledOnlinePayment(
      { id: item.id, data: { is_enabled: !isEnabled } },
    );
  };

  const handleAction = async (
    action: string | number | (string | number)[],
    item: OnlinePayment,
  ) => {
    if (action === 'delete') {
      dispatchToastMessage('delete', {
        title: __('Payment gateway deleted', 'kirki-ecommerce'),
        duration: 5000,
      });
      return;
    }

    if (action === 'edit' && item.id !== undefined) {
      const result = await getOnlinePayment(item.id);

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

            {onlinePaymentList.length === 0 ? (
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
                {onlinePaymentList.map((item) => (
                  <Card key={item.id} cssOverride={cardStyles.innerCard}>
                    <CardContent
                      cssOverride={mergeCss(
                        cardStyles.innerContent,
                        styles.onlinePaymentContent,
                      )}
                    >
                      <Flex align="center">
                        <Flex gap={2} align="center">
                          {item.icon && <img src={item.icon} alt="online-payment-icon" css={scoped(styles.icon)} />}
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
                          <Switch checked={Boolean(item?.is_enabled)} onCheckedChange={() => handleToggleOnlinePayment(item)} />
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

      <OnlinePaymentEditPopup
        editedItem={editedItem}
        isOpen={openPopup}
        onClose={() => setOpenPopup(false)}
      />

      {isEditPopupOpen && (
        <OnlinePaymentPopup
          openPopup={isEditPopupOpen}
          setOpenPopup={setIsEditPopupOpen}
        />
      )}
    </>
  );
};

OnlinePaymentList.displayName = 'OnlinePaymentList';

export default OnlinePaymentList;

const styles = defineStyles({
  onlinePaymentContent: {
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  },
  emptyStateContent: {
    paddingBlock: theme.spacing[9],
  },
  icon: {
    height: 20,
    width: 'auto',
    objectFit: 'contain',
  },
});
