import { useState } from 'react';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { BankIconLarge, ShowMoreIcon, CashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Badge from '@/molecules/badge';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import ToggleButton from '@/molecules/toggle-button';
import { dispatchToastMessage } from '@/pages/utils';
import {
  useDeletePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
} from '@/services/payment';
import type { PaymentMethod } from '@/types';
import { __, sprintf } from '@/wpi18n';

import ManualPaymentPopup from '@/pages/settings/payment-settings/manual-payment-dialog';

type ManualPaymentProps = {
  manualPaymentList: PaymentMethod[];
  refetch: () => void;
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
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
        <HeaderActionsCard
          header={__('Manual payment methods', 'kirki-ecommerce')}
          subHeader={__(
            "For manual payments, you'll need to approve orders made outside your online store. Add Manual Payment",
            'kirki-ecommerce',
          )}
          buttonText={__('Add Payment Methods', 'kirki-ecommerce')}
          onAdd={() => setIsPopupOpen(true)}
        />

        {manualPaymentList?.length === 0 ? (
          <Card
            className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-innerDark`}
            style={{ padding: 'var(--decom-spacing-9) var(--decom-spacing-0)' }}
          >
            <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
              <CashIcon />
              <span style={{ color: 'var(--decom-text-text-subdued)' }}>
                {__('No payment added yet', 'kirki-ecommerce')}
              </span>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" gap={16}>
            {manualPaymentList?.map((item, index) => (
              <Card
                className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner`}
                key={index}
                style={{
                  padding: 'var(--decom-spacing-3) var(--decom-spacing-4)',
                }}
              >
                <Flex style={{ alignItems: 'center' }}>
                  <Text
                    header={sprintf(
                      __('%s', 'kirki-ecommerce'),
                      item?.name || '',
                    )}
                    leftIcon={
                      item?.icon ? (
                        <img
                          height={20}
                          width={20}
                          src={item?.icon as string}
                        ></img>
                      ) : (
                        <BankIconLarge />
                      )
                    }
                    badge={
                      !item?.is_enabled && (
                        <Badge
                          text={__('Inactive', 'kirki-ecommerce')}
                          type="trashed"
                        />
                      )
                    }
                    type={!item?.is_enabled ? 'disabled' : 'secondary'}
                  />
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
              </Card>
            ))}
          </Flex>
        )}
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
