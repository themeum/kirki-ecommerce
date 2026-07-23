import { type Dispatch, type SetStateAction } from 'react';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckedIcon, StripeIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
        <DialogBody>
          <Flex direction="column" gap={16}>
            {(availableGatewayList as AvailablePaymentGateway[])?.map(
              (item, index) => (
                <Card key={index} css={styles.innerCard}>
                  <CardContent css={styles.innerContent}>
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
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

PaymentGatewayPopup.displayName = 'PaymentGatewayPopup';

const styles = {
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({
    padding: theme.spacing.lg,
  }),
};

export default PaymentGatewayPopup;
