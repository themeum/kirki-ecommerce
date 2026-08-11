import { Check } from 'lucide-react';
import { type Dispatch, type SetStateAction } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { useInstallableOnlinePaymentsQuery, useInstallOnlinePaymentMutation } from '@/services/payment';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import type { OnlinePayment } from '@/types';
import { __ } from '@/wpi18n';

type OnlinePaymentPopupProps = {
  openPopup: boolean;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
};

const OnlinePaymentPopup = ({
  openPopup,
  setOpenPopup,
}: OnlinePaymentPopupProps) => {
  const { data: availableOnlinePaymentList = [] } =
    useInstallableOnlinePaymentsQuery();
  const { mutate: installOnlinePayment } = useInstallOnlinePaymentMutation();

  const handleInstallOnlinePayment = (item: OnlinePayment) => {
    if (item.id === undefined) {
      return;
    }
    installOnlinePayment({ id: item.id });
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
            {availableOnlinePaymentList.map(
              (item, index) => (
                <Card key={index} cssOverride={mergeCss(cardStyles.innerCard, styles.itemCard)}>
                  <CardContent cssOverride={cardStyles.innerContent}>
                    <Flex align="center">
                      <Flex gap={2} align="center">
                        {item.icon && <img src={item.icon} alt="online-payment-icon" css={scoped(styles.icon)} />}
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
                              onClick={() => handleInstallOnlinePayment(item)}
                              data-add-button
                            >
                              {__('Add', 'kirki-ecommerce')}
                            </Button>
                          ) : (
                            <Badge>{__('Coming Soon', 'kirki-ecommerce')}</Badge>
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

OnlinePaymentPopup.displayName = 'OnlinePaymentPopup';

export default OnlinePaymentPopup;

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
  },
});