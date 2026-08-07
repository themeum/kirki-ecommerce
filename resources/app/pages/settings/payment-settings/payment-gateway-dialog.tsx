import { type Dispatch, type SetStateAction } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { useInstallablePaymentGatewaysQuery, useInstallPaymentGatewayMutation } from '@/services/payment';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import type { PaymentGateway } from '@/types';
import { __ } from '@/wpi18n';
import { Check } from 'lucide-react';

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

  const handleInstallPaymentGateway = (item: PaymentGateway) => {
    if (item.id === undefined) {
      return;
    }
    installGateway({ id: item.id });
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
        <DialogBody>
          <Flex direction="column" gap={4}>
            {availableGatewayList.map(
              (item, index) => (
                <Card key={index} cssOverride={mergeCss(cardStyles.innerCard, styles.itemCard)}>
                  <CardContent cssOverride={cardStyles.innerContent}>
                    <Flex align="center">
                      <Flex gap={2} align="center">
                        {item.icon && <img src={item.icon} alt="gateway-icon" css={scoped(styles.icon)} />}
                        <Text variant="small" weight="medium">{item.name}</Text>
                      </Flex>
                      <ActionGroup>
                        {item?.is_installed === true ? (
                          <Badge variant="success">
                            <Check />
                            {__('Added', 'kirki-ecommerce')}
                          </Badge>
                        ) : (
                          item.is_available ? (
                            <Button
                              variant="primary"
                              onClick={() => handleInstallPaymentGateway(item)}
                              data-add-button
                            >
                              {__('Add', 'kirki-ecommerce')}
                            </Button>
                          ) : (
                            <Badge>Coming Soon</Badge>
                          )
                        )}
                      </ActionGroup>
                    </Flex>
                  </CardContent>
                </Card>
              ),
            )}
          </Flex>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

PaymentGatewayPopup.displayName = 'PaymentGatewayPopup';

export default PaymentGatewayPopup;

const styles = defineStyles({
  itemCard: {
    '&:hover [data-add-button]': {
      visibility: 'visible',
    },
  },
  icon: {
    height: 20,
    width: 'auto',
    objectFit: 'contain',
  }
})