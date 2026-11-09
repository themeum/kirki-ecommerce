import { Check } from 'lucide-react';
import { type Dispatch, type SetStateAction } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
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
import EmptyState from '@/components/ui/empty-state';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import QueryErrorState from '@/components/ui/query-error-state';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import type { OnlinePayment } from '@/features/settings/payment/schemas/catalog/payment';
import {
  useInstallableOnlinePaymentsQuery,
  useInstallOnlinePaymentMutation,
  useUpdateOnlinePaymentPluginMutation,
} from '@/features/settings/payment/services/payment';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type OnlinePaymentPopupProps = {
  openPopup: boolean;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
};

const OnlinePaymentPopup = ({ openPopup, setOpenPopup }: OnlinePaymentPopupProps) => {
  const {
    data: availableOnlinePaymentList = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useInstallableOnlinePaymentsQuery();
  const {
    mutate: installOnlinePayment,
    isPending: isInstalling,
    variables: installingVariables,
  } = useInstallOnlinePaymentMutation();

  const {
    mutate: updateOnlinePaymentPlugin,
    isPending: isUpdating,
    variables: updatingVariables,
  } = useUpdateOnlinePaymentPluginMutation();

  const handleInstallOnlinePayment = (item: OnlinePayment) => {
    if (item.id === undefined) {
      return;
    }
    installOnlinePayment({ id: item.id });
  };

  const handleUpdateOnlinePaymentPlugin = (item: OnlinePayment) => {
    if (item.id === undefined) {
      return;
    }
    updateOnlinePaymentPlugin({ id: item.id });
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
          <DialogTitle>{__('Available Payment Gateways', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {isLoading && (
            <Flex justify="center">
              <Spinner />
            </Flex>
          )}
          {isError && <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />}
          {!isLoading && !isError && availableOnlinePaymentList.length === 0 && (
            <EmptyState text={__('No payment gateways available', 'kirki-ecommerce')} />
          )}
          <Flex direction="column" gap={4}>
            {availableOnlinePaymentList.map((item, index) => (
              <Card data-search-skip="true" key={index} cssOverride={mergeCss(cardStyles.innerCard, styles.itemCard)}>
                <CardContent cssOverride={cardStyles.innerContent}>
                  <Flex align="center">
                    <Flex gap={2} align="center">
                      {item.icon && (
                        <Image
                          src={item.icon}
                          alt="online-payment-icon"
                          height={20}
                          width={20}
                          fit="contain"
                          cssOverride={styles.icon}
                        />
                      )}
                      <Text variant="small" weight="medium">
                        {item.name}
                      </Text>
                    </Flex>
                    <ActionGroup>
                      {item?.is_installed === true ? (
                        <>
                          {item.update_blocked_reason && (
                            <Text variant="small" color="subdued">
                              {item.update_blocked_reason}
                            </Text>
                          )}
                          <Badge variant="success">
                            <Check />
                            {__('Added', 'kirki-ecommerce')}
                          </Badge>
                          {item.update_available === true && (
                            <Button
                              variant="secondary"
                              loading={isUpdating && updatingVariables.id === item.id}
                              disabled={isUpdating && updatingVariables.id === item.id}
                              onClick={() => handleUpdateOnlinePaymentPlugin(item)}
                            >
                              {__('Update', 'kirki-ecommerce')}
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          loading={isInstalling && installingVariables.id === item.id}
                          disabled={isInstalling}
                          onClick={() => handleInstallOnlinePayment(item)}
                          data-add-button
                        >
                          {__('Add', 'kirki-ecommerce')}
                        </Button>
                      )}
                    </ActionGroup>
                  </Flex>
                </CardContent>
              </Card>
            ))}
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
    width: 'auto',
    border: 'none',
    borderRadius: theme.radius.none,
    backgroundColor: 'transparent',
  },
});
