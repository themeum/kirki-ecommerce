import { useState } from 'react';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { MapIcon, StripeIcon, ShowMoreIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ToggleButton from '@/components/ui/toggle-button';
import { dispatchToastMessage } from '@/pages/utils';
import {
  getPaymentGateway,
  useSetEnabledPaymentGatewayMutation,
} from '@/services/payment';
import type { PaymentGateway } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __, sprintf } from '@/wpi18n';

import PaymentGatewayEditPopup from '@/pages/settings/payment-settings/payment-gateway-edit-dialog';
import PaymentGatewayPopup from '@/pages/settings/payment-settings/payment-gateway-dialog';

type PaymentGatewayDetail = PaymentGateway & {
  settings?: Record<string, unknown>;
  fields?: Array<{ name: string; label?: string; type?: string }>;
  is_enabled?: boolean;
};

type PaymentGatewayProps = {
  paymentGatewayList: PaymentGateway[];
};

const PaymentGatewayComponent = (props: PaymentGatewayProps) => {
  const { paymentGatewayList } = props;

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<PaymentGatewayDetail | null>(
    null,
  );
  const [openPopup, setOpenPopup] = useState(false);

  const { mutate: setEnabledGateway } = useSetEnabledPaymentGatewayMutation();

  const handleToggleMethod = (item: PaymentGateway) => {
    const isEnabled = Boolean(item?.is_enabled);
    const params = { is_enabled: !isEnabled };
    setEnabledGateway(
      { id: item?.id, data: params },
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
        onSuccess: async () => {},
      });
    } else if (action === 'edit') {
      const result = await getPaymentGateway(item?.id);
      if (result) {
        setEditedItem(result as PaymentGatewayDetail);
        setOpenPopup(true);
      }
    }
  };

  return (
    <>
      <Card css={cardStyles.largeCard} >
        <CardContent css={cardStyles.largeContentPadded}>

        <HeaderActionsCard
        header={__('Payment gateways', 'kirki-ecommerce')}
        subHeader={__(
        "Set up and manage your online store's payment options.",
        'kirki-ecommerce',
        )}
        buttonText={__('Add Payment Methods', 'kirki-ecommerce')}
        onAdd={() => setIsEditPopupOpen(true)}
        />
        {paymentGatewayList?.length === 0 ? (
        <Card css={cardStyles.innerDarkCard}>
          <CardContent css={[cardStyles.innerDarkContent, styles.emptyStateContent]}>
            <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
              <MapIcon />
              <span style={{ color: '#878593' }}>
                {__('No payment added yet', 'kirki-ecommerce')}
              </span>
            </Flex>
          </CardContent>
        </Card>
        ) : (
        <Flex direction="column" gap={16}>
        {paymentGatewayList?.map((item, index) => (
        <Card css={cardStyles.innerCard}
                
        key={index}
        >
          <CardContent css={[cardStyles.innerContent, styles.gatewayItemContent]}>

          <Flex style={{ alignItems: 'center' }}>
          <Text
          header={sprintf(
          __('%s', 'kirki-ecommerce'),
          item?.name || '',
          )}
          leftIcon={<StripeIcon />}
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
        <PaymentGatewayEditPopup
        editedItem={editedItem}
        isOpen={openPopup}
        onClose={() => setOpenPopup(false)}
        />
        </CardContent>
      </Card>
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

const styles = {
  emptyStateContent: scoped({ padding: `${theme.spacing[9]} 0` }),
  gatewayItemContent: scoped({
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  })
};

export default PaymentGatewayComponent;
