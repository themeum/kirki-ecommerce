import { useState } from 'react';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ToggleButton from '@/components/ui/toggle-button';
import { BankIconLarge, CashIcon, ShowMoreIcon } from '@/icons';
import { dispatchToastMessage } from '@/pages/utils';
import { useDeletePaymentMethodMutation, useUpdatePaymentMethodMutation } from '@/services/payment';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import type { PaymentMethod } from '@/types';
import { __ } from '@/wpi18n';

import ManualPaymentPopup from '@/pages/settings/payment-settings/manual-payment-dialog';

type ManualPaymentProps = {
  manualPaymentList: PaymentMethod[];
  refetch: () => void;
};

/**
 * The API sends `icon` as a bare identifier ("cash", "stripe") for built-in
 * methods and a media URL for uploaded ones, so only the latter is usable as
 * an image source — the former has to fall back to the built-in icon.
 */
const getIconUrl = (icon: PaymentMethod['icon']) => {
  if (typeof icon !== 'string') {
    return null;
  }

  return /^(https?:)?\/\//.test(icon) || icon.startsWith('/') ? icon : null;
};

const ManualPayment = (props: ManualPaymentProps) => {
  const { manualPaymentList, refetch } = props;

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const { mutate: deleteMethod } = useDeletePaymentMethodMutation();
  const { mutate: updateMethod } = useUpdatePaymentMethodMutation();

  const handleAction = (
    action: string | number | Array<string | number>,
    item: PaymentMethod,
  ) => {
    if (action === 'delete') {
      dispatchToastMessage('delete', {
        title: __('Payment method deleted', 'kirki-ecommerce'),
        duration: 5000,
        undoAction: () => refetch(),
        onSuccess: async () => {
          deleteMethod(item.id, { onSuccess: () => refetch() });
        },
      });
    }

    if (action === 'edit') {
      setEditingMethod(item);
      setIsPopupOpen(true);
    }
  };

  const handleToggleMethod = (item: PaymentMethod) => {
    const isEnabled = Boolean(item?.is_enabled);
    const updatedItem = { ...item, is_enabled: !isEnabled };

    updateMethod(
      { id: item?.id, data: updatedItem as Record<string, unknown> },
      {
        onSuccess: () => {
          dispatchToastMessage('success', {
            title: __('Payment method updated', 'kirki-ecommerce'),
          });
          refetch();
        },
        onError: () => {
          dispatchToastMessage('error', {
            title: __('Something went wrong', 'kirki-ecommerce'),
          });
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

            {manualPaymentList.length === 0 ? (
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
                {manualPaymentList.map((item) => (
                  <Card key={item.id} cssOverride={cardStyles.innerCard}>
                    <CardContent
                      cssOverride={mergeCss(
                        cardStyles.innerContent,
                        styles.methodContent,
                      )}
                    >
                      <Flex align="center">
                        <Flex gap={2} align="center">
                          {getIconUrl(item?.icon) ? (
                            <img
                              src={getIconUrl(item.icon) as string}
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
                          <ToggleButton
                            value={Boolean(item?.is_enabled)}
                            onChange={() => handleToggleMethod(item)}
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

      <ManualPaymentPopup
        openPopup={isPopupOpen}
        setOpenPopup={setIsPopupOpen}
        editingMethod={editingMethod}
        setEditingMethod={setEditingMethod}
      />
    </>
  );
};

ManualPayment.displayName = 'ManualPayment';

export default ManualPayment;

const styles = defineStyles({
  methodContent: {
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  },
  emptyStateContent: {
    paddingBlock: theme.spacing[9],
  },
});
