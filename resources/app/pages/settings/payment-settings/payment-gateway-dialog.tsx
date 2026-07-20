import { type Dispatch, type SetStateAction } from 'react';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CLASS_PREFIX } from '@/conf';
import { CheckedIcon, StripeIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import {
  useInstallablePaymentGatewaysQuery,
  useInstallPaymentGatewayMutation,
} from '@/services/payment';
import type { PaymentGateway } from '@/types';
import { __ } from '@/wpi18n';

type AvailablePaymentGateway = PaymentGateway & {
  is_installed?: boolean;
};

type PaymentGatewayPopupProps = {
  openPopup: boolean;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
};

const PaymentGatewayPopup = ({
  openPopup,
  setOpenPopup,
}: PaymentGatewayPopupProps) => {
  const { data: availableGatewayList = [] } =
    useInstallablePaymentGatewaysQuery();
  const { mutate: installGateway } = useInstallPaymentGatewayMutation();

  const handleInstallPaymentGateway = (item: AvailablePaymentGateway) => {
    const gatewayID = { id: item?.id };
    installGateway(gatewayID);
  };

  return (
    <Dialog
      open={openPopup}
      onOpenChange={(next) => {
        if (!next) {
          setOpenPopup(false);
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {__('Available Payment Gateways', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <div className={`${CLASS_PREFIX}-ui-dialog-body`}>
          <Flex direction="column" gap={16}>
            {(availableGatewayList as AvailablePaymentGateway[])?.map(
              (item, index) => (
                <Card
                  key={index}
                  className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner`}
                >
                  <CardContent>
                    <Flex style={{ alignItems: 'center' }}>
                      <Text
                        header={item?.name}
                        type="secondary"
                        leftIcon={<StripeIcon />}
                      />
                      <ActionGroup>
                        {item?.is_installed === true ? (
                          <Button variant="ghost" size="sm">
                            <CheckedIcon />
                            {__('Added', 'kirki-ecommerce')}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleInstallPaymentGateway(item)}
                          >
                            {__('Add', 'kirki-ecommerce')}
                          </Button>
                        )}
                      </ActionGroup>
                    </Flex>
                  </CardContent>
                </Card>
              ),
            )}
          </Flex>
        </div>
      </DialogContent>
    </Dialog>
  );
};

PaymentGatewayPopup.displayName = 'PaymentGatewayPopup';

export default PaymentGatewayPopup;
