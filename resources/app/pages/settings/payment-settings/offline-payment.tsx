import { useState } from 'react';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { BankIconLarge, CashIcon, ShowMoreIcon } from '@/icons';
import OfflinePaymentPopup from '@/pages/settings/payment-settings/offline-payment-dialog';
import type { OfflinePayment } from '@/schemas/catalog/payment';
import { useDeleteOfflinePaymentMutation, useUpdateOfflinePaymentMutation } from '@/services/payment';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { dispatchToastMessage } from '@/utils/common';
import { __ } from '@/wpi18n';

type OfflinePaymentProps = {
  offlinePaymentList: OfflinePayment[];
  refetch: () => void;
};

/**
 * The API sends `icon` as a bare identifier ("cash", "stripe") for built-in
 * methods and a media URL for uploaded ones, so only the latter is usable as
 * an image source — the former has to fall back to the built-in icon.
 */
const getIconUrl = (icon: OfflinePayment['icon']) => {
  if (typeof icon !== 'string') {
    return null;
  }

  return /^(https?:)?\/\//.test(icon) || icon.startsWith('/') ? icon : null;
};

const OfflinePaymentComponent = (props: OfflinePaymentProps) => {
  const { offlinePaymentList, refetch } = props;

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<OfflinePayment | null>(null);

  const { mutate: deleteOfflinePayment } = useDeleteOfflinePaymentMutation();
  const { mutate: updateOfflinePayment } = useUpdateOfflinePaymentMutation();

  const handleAction = (
    action: string | number | (string | number)[],
    item: OfflinePayment,
  ) => {
    if (action === 'delete') {
      dispatchToastMessage('delete', {
        title: __('Payment method deleted', 'kirki-ecommerce'),
        duration: 5000,
        undoAction: () => refetch(),
        onSuccess: () => {
          deleteOfflinePayment(item.id, { onSuccess: () => refetch() });
        },
      });
    }

    if (action === 'edit') {
      setEditingMethod(item);
      setIsPopupOpen(true);
    }
  };

  const handleToggleOfflinePayment = (item: OfflinePayment) => {
    const isEnabled = Boolean(item?.is_enabled);
    const updatedItem = { ...item, is_enabled: !isEnabled };

    updateOfflinePayment(
      { id: item?.id, data: updatedItem },
      {
        onSuccess: () => {
          refetch();
        },
      },
    );
  };

  return (
    <>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent >
          <Flex direction="column" gap={4}>
            <HeaderActionsCard
              header={__('Manual payment methods', 'kirki-ecommerce')}
              subHeader={__(
                "For manual payments, you'll need to approve orders made outside your online store.",
                'kirki-ecommerce',
              )}
              buttonText={__('Add Payment Methods', 'kirki-ecommerce')}
              onAdd={() => setIsPopupOpen(true)}
            />

            {offlinePaymentList.length === 0 ? (
              <Card cssOverride={cardStyles.innerDarkCard}>
                <CardContent
                  cssOverride={mergeCss(
                    cardStyles.innerDarkContent,
                    styles.emptyStateContent,
                  )}
                >
                  <Flex direction="column" gap={2} align="center">
                    <CashIcon />
                    <Text color="subdued">
                      {__('No payment added yet', 'kirki-ecommerce')}
                    </Text>
                  </Flex>
                </CardContent>
              </Card>
            ) : (
              <Flex direction="column" gap={3}>
                {offlinePaymentList.map((item) => (
                  <Card key={item.id} cssOverride={cardStyles.innerCard}>
                    <CardContent
                      cssOverride={mergeCss(
                        cardStyles.innerContent,
                        styles.offlinePaymentContent,
                      )}
                    >
                      <Flex align="center">
                        <Flex gap={2} align="center">
                          {getIconUrl(item?.icon) ? (
                            <img
                              src={getIconUrl(item.icon)!}
                              alt=""
                              height={20}
                              width={20}
                            />
                          ) : (
                            <BankIconLarge />
                          )}
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
                          <Switch
                            checked={Boolean(item?.is_enabled)}
                            onCheckedChange={() => handleToggleOfflinePayment(item)}
                          />
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

      <OfflinePaymentPopup
        openPopup={isPopupOpen}
        setOpenPopup={setIsPopupOpen}
        editingMethod={editingMethod}
        setEditingMethod={setEditingMethod}
      />
    </>
  );
};

OfflinePaymentComponent.displayName = 'OfflinePaymentComponent';

export default OfflinePaymentComponent;

const styles = defineStyles({
  offlinePaymentContent: {
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  },
  emptyStateContent: {
    paddingBlock: theme.spacing[9],
  },
});
