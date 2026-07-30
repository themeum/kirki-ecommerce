import { useState } from 'react';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import { Card, CardContent } from '@/components/ui/card';
import { MapIcon, StripeIcon, ShowMoreIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ToggleButton from '@/components/ui/toggle-button';
import { dispatchToastMessage } from '@/pages/utils';
import { getPaymentGateway, useSetEnabledPaymentGatewayMutation } from '@/services/payment';
import type { PaymentGateway } from '@/types';
import { theme } from '@/theme';
import { scoped, mergeCss, defineStyles } from '@/theme/mixins';
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
      <Card cssOverride={cardStyles.largeCard} >
        <CardContent cssOverride={cardStyles.largeContentPadded}>

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
        <Card cssOverride={cardStyles.innerDarkCard}>
          <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyStateContent)}>
            <Flex direction="column" gap={2} align="center">
              <MapIcon />
              <span css={scoped(styles.mutedText)}>
                {__('No payment added yet', 'kirki-ecommerce')}
              </span>
            </Flex>
          </CardContent>
        </Card>
        ) : (
        <Flex direction="column" gap={4}>
        {paymentGatewayList?.map((item, index) => (
        <Card cssOverride={cardStyles.innerCard}
                
        key={index}
        >
          <CardContent cssOverride={mergeCss(cardStyles.innerContent, styles.gatewayItemContent)}>

          <Flex align="center">
          <Flex gap={2} align="center">
            <StripeIcon />
            <Text
              weight="medium"
              color={!item?.is_enabled ? 'disabled' : 'primary'}
            >
              {sprintf(__('%s', 'kirki-ecommerce'), item?.name || '')}
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

const styles = defineStyles({
  emptyStateContent: { padding: `${theme.spacing[9]} 0` },
  gatewayItemContent: {
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  },
  mutedText: {
    color: theme.colors.text.subdued,
  },
});

export default PaymentGatewayComponent;
