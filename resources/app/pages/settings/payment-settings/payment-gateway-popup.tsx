import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import { CheckedIcon, StripeIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import { Popover, PopoverBody, PopoverHeader } from '@/molecules/popover';
import Text from '@/molecules/text';
import {
  getAvailablePaymentGatewayAPI,
  installPaymentGatewayAPI,
} from '@/store/settingsSlice';
import type { PaymentGateway } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

type AvailablePaymentGateway = PaymentGateway & {
  is_installed?: boolean;
};

type PaymentGatewayPopupProps = {
  openPopup: boolean;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
  setIsMethodListUpdated: Dispatch<SetStateAction<boolean>>;
};

const PaymentGatewayPopup = ({
  openPopup,
  setOpenPopup,
  setIsMethodListUpdated,
}: PaymentGatewayPopupProps) => {
  const [availableGatewayList, setAvailableGatewayList] = useState<
    AvailablePaymentGateway[]
  >([]);

  const fetchPaymentGateway = async () => {
    const result = await getAvailablePaymentGatewayAPI();
    if (isApiSuccess(result)) {
      setAvailableGatewayList(result.data as AvailablePaymentGateway[]);
    }
  };

  useEffect(() => {
    fetchPaymentGateway();
  }, []);

  const handleInstallPaymentGateway = async (item: AvailablePaymentGateway) => {
    const gatewayID = { id: item?.id };
    const result = await installPaymentGatewayAPI(gatewayID);
    if (isApiSuccess(result)) {
      fetchPaymentGateway();
      setIsMethodListUpdated(true);
    }
  };

  return (
    <Popover isOpen={openPopup} style={{ width: '600px' }}>
      <PopoverHeader
        style={{ padding: 'var(--decom-spacing-5)' }}
        onClose={() => setOpenPopup(false)}
      >
        {__('Available Payment Gateways', 'kirki-ecommerce')}
      </PopoverHeader>
      <PopoverBody
        style={{
          padding:
            'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
        }}
      >
        <Flex direction="column" gap={16}>
          {availableGatewayList?.map((item, index) => (
            <Card
              type="inner"
              key={index}
              style={{
                padding: 'var(--decom-spacing-3) var(--decom-spacing-4)',
              }}
            >
              <Flex style={{ alignItems: 'center' }}>
                <Text
                  header={item?.name}
                  type="secondary"
                  leftIcon={<StripeIcon />}
                />
                <ActionGroup>
                  {item?.is_installed === true ? (
                    <Button
                      type="primarySoft"
                      size="small"
                      text={__('Added', 'kirki-ecommerce')}
                      leftIcon={<CheckedIcon />}
                      style={{
                        background: 'transparent',
                      }}
                    />
                  ) : (
                    <Button
                      type="secondary"
                      size="small"
                      text={__('Add', 'kirki-ecommerce')}
                      onClick={() => handleInstallPaymentGateway(item)}
                    />
                  )}
                </ActionGroup>
              </Flex>
            </Card>
          ))}
        </Flex>
      </PopoverBody>
    </Popover>
  );
};

export default PaymentGatewayPopup;
