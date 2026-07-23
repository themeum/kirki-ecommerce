import { useState } from 'react';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { BankIconLarge, ShowMoreIcon, CashIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ToggleButton from '@/components/ui/toggle-button';
import { dispatchToastMessage } from '@/pages/utils';
import {
  useDeletePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
} from '@/services/payment';
import type { PaymentMethod } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
      <Card css={styles.largeCard} >
        <CardContent css={styles.largeContent}>

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
        <Card css={styles.innerDarkCard}>
          <CardContent css={[styles.innerDarkContent, styles.emptyStateContent]}>
            <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
              <CashIcon />
              <span style={{ color: theme.colors.text.subdued }}>
                {__('No payment added yet', 'kirki-ecommerce')}
              </span>
            </Flex>
          </CardContent>
        </Card>
        ) : (
        <Flex direction="column" gap={16}>
        {manualPaymentList?.map((item, index) => (
        <Card css={styles.innerCard}
                
        key={index}
        >
          <CardContent css={[styles.innerContent, styles.gatewayItemContent]}>

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
          </CardContent>

          </Card>

          ))}
        </Flex>
        )}
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

const styles = {
  formCard: scoped({ rowGap: theme.spacing['2xl'] }),
  largeCard: scoped({ gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({ padding: theme.spacing['3xl'] }),
  innerCard: scoped({ borderRadius: theme.radius.lg, boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({ padding: theme.spacing.lg }),
  gatewayItemContent: scoped({
    padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
  }),
  innerDarkCard: scoped({
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing.none,
  }),
  innerDarkContent: scoped({ padding: theme.spacing.lg }),
  emptyStateContent: scoped({
    padding: `${theme.spacing['7xl']} ${theme.spacing.none}`,
  }),
  darkCard: scoped({ backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
  lightCard: scoped({ borderRadius: theme.radius.md,
    padding: theme.spacing.none,
  }),
  shadowCard: scoped({
    boxShadow: '0px -1px 1px 0.5px #0000001a inset',
    border: 'none',
  }),
  tartiaryCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
};

export default ManualPayment;
