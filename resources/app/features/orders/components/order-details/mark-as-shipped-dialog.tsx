import { zodResolver } from '@hookform/resolvers/zod';
import { CircleMinus, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import NotifyCustomer from '@/features/orders/components/order-details/notify-customer';
import TrackingFields from '@/features/orders/components/order-details/tracking-fields';
import { useOrderAction } from '@/features/orders/hooks/use-order-action';
import { useOrderDetails } from '@/features/orders/hooks/use-order-details';
import {
  getEmptyTrackingValues,
  getInitialTrackingValues,
} from '@/features/orders/lib/shipping-tracking';
import type {
  LastUsedShippingCarrier,
  OrderShippingCarrier,
} from '@/features/orders/schemas/catalog/order';
import {
  type AddTrackingFormInput,
  type AddTrackingFormPayload,
  AddTrackingFormSchema,
} from '@/features/orders/schemas/forms/add-tracking-form';
import {
  useLastUsedShippingCarrierQuery,
  useOrderShippingCarriersQuery,
} from '@/features/orders/services/order';
import { DATE_FORMATS, formatDateValue, parseDateValue } from '@/libs/date';
import { getDefaults } from '@/libs/zod';
import { useSettingsQuery } from '@/services/settings';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __, sprintf } from '@/wpi18n';

type MarkAsShippedPayload = {
  tracking: AddTrackingFormPayload | null;
  notify_customer: boolean;
};

type ShipFormProps = {
  carriers: OrderShippingCarrier[];
  lastUsedCarrier: LastUsedShippingCarrier | undefined;
};

type ShipDialogBodyProps = {
  orderId: number;
};

const formatPickupTime = (time: string) => {
  return formatDateValue(parseDateValue(time, DATE_FORMATS.TIME_INPUT), 'h:mm a') ?? time;
};

const LocalPickup = () => {
  const { order } = useOrderDetails();
  const { isActionPending, setIsMarkAsShippedDialogOpen, handleMarkAsShipped } = useOrderAction();
  const shippingMeta = order?.shipping_meta;

  const pickupTitle = shippingMeta?.address
    ? sprintf(
        /* translators: %s: pickup address */
        __('Pickup at %s', 'kirki-ecommerce'),
        shippingMeta.address,
      )
    : order?.shipping_method_name;

  return (
    <>
      <DialogBody>
        <Flex direction="column" gap={3}>
          {isDefined(order) && (
            <Flex direction="column" gap={1} cssOverride={styles.pickupBox}>
              <Text variant="small" weight="semibold">
                {pickupTitle}
              </Text>
              {isDefined(shippingMeta) &&
                shippingMeta.has_pick_time &&
                shippingMeta.pickup_time_start &&
                shippingMeta.pickup_time_end && (
                  <Text variant="small" color="secondary">
                    {
                      /* translators: %1$s: pickup start time, %2$s: pickup end time */
                      sprintf(
                        __('Pickup time: %1$s - %2$s', 'kirki-ecommerce'),
                        formatPickupTime(shippingMeta.pickup_time_start),
                        formatPickupTime(shippingMeta.pickup_time_end),
                      )
                    }
                  </Text>
                )}
              {shippingMeta?.description && (
                <Text variant="small" color="secondary">
                  {
                    /* translators: %s: pickup instruction */
                    sprintf(
                      __('Pickup instruction: %s', 'kirki-ecommerce'),
                      shippingMeta.description,
                    )
                  }
                </Text>
              )}
            </Flex>
          )}
        </Flex>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={() => setIsMarkAsShippedDialogOpen(false)}>
          {__('Cancel', 'kirki-ecommerce')}
        </Button>
        <Button
          variant="primary"
          loading={isActionPending}
          onClick={() => handleMarkAsShipped({ tracking: null, notify_customer: false })}
        >
          {__('Ready for pickup', 'kirki-ecommerce')}
        </Button>
      </DialogFooter>
    </>
  );
};

const ShipForm = ({ carriers, lastUsedCarrier }: ShipFormProps) => {
  const { isActionPending, setIsMarkAsShippedDialogOpen, handleMarkAsShipped } = useOrderAction();
  const [hasTracking, setHasTracking] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const { data: emailSettings } = useSettingsQuery('email');

  const isOrderShippedNotificationEnabled = useMemo(() => {
    if (
      !isDefined(emailSettings) ||
      !isDefined(emailSettings.customer_emails) ||
      !isDefined(emailSettings.customer_emails.order_notifications) ||
      !isDefined(emailSettings.customer_emails.order_notifications.order_shipped)
    ) {
      return false;
    }

    return emailSettings.customer_emails.order_notifications.order_shipped.is_enabled;
  }, [emailSettings]);

  const initialCarrierValues = useMemo(() => {
    return getInitialTrackingValues(carriers, lastUsedCarrier);
  }, [carriers, lastUsedCarrier]);

  const form = useForm<AddTrackingFormInput, unknown, AddTrackingFormPayload>({
    resolver: zodResolver(AddTrackingFormSchema),
    defaultValues: {
      ...getDefaults(AddTrackingFormSchema),
      ...initialCarrierValues,
    },
    mode: 'onChange',
  });

  const carrier = useWatch({ control: form.control, name: 'carrier' });

  useEffect(() => {
    form.reset({ ...getDefaults(AddTrackingFormSchema), ...initialCarrierValues });
  }, [form, initialCarrierValues]);

  useEffect(() => {
    if (isOrderShippedNotificationEnabled) {
      setNotifyCustomer(true);
    }
  }, [isOrderShippedNotificationEnabled]);

  useEffect(() => {
    if (carrier) {
      setHasTracking(true);
    }
  }, [carrier]);

  const handleRemoveTracking = useCallback(() => {
    form.reset({ ...getDefaults(AddTrackingFormSchema), ...getEmptyTrackingValues() });
    setHasTracking(false);
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!hasTracking) {
      handleMarkAsShipped({ tracking: null, notify_customer: notifyCustomer });
      return;
    }

    void form.handleSubmit((tracking) =>
      handleMarkAsShipped({ tracking, notify_customer: notifyCustomer }),
    )();
  }, [form, hasTracking, notifyCustomer, handleMarkAsShipped]);

  return (
    <Form {...form}>
      <DialogBody>
        <Flex direction="column">
          {hasTracking ? (
            <Flex direction="column" gap={2}>
              <Flex justify="space-between" align="center">
                <Text variant="small" weight="semibold">
                  {__('Tracking details', 'kirki-ecommerce')}
                </Text>
                <Button
                  variant="tertiary"
                  size="icon"
                  aria-label={__('Remove tracking details', 'kirki-ecommerce')}
                  onClick={handleRemoveTracking}
                >
                  <CircleMinus size={16} />
                </Button>
              </Flex>
              <TrackingFields carriers={carriers} />
            </Flex>
          ) : (
            <Button
              variant="ghost"
              cssOverride={styles.addSlot}
              onClick={() => setHasTracking(true)}
            >
              <Plus size={16} aria-hidden="true" color={theme.colors.text.emphasis} />
              <Text color="emphasis" weight="medium" variant="heading6">
                {__('Add tracking details', 'kirki-ecommerce')}
              </Text>
              <Text cssOverride={styles.optional} variant="small" color="secondary">
                {__('Optional', 'kirki-ecommerce')}
              </Text>
            </Button>
          )}
          {isOrderShippedNotificationEnabled && (
            <NotifyCustomer
              label={__('Email the customer that it shipped', 'kirki-ecommerce')}
              value={notifyCustomer}
              onChange={setNotifyCustomer}
            />
          )}
        </Flex>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={() => setIsMarkAsShippedDialogOpen(false)}>
          {__('Cancel', 'kirki-ecommerce')}
        </Button>
        <Button
          variant="primary"
          disabled={isActionPending}
          loading={isActionPending}
          onClick={handleSubmit}
        >
          {__('Mark as shipped', 'kirki-ecommerce')}
        </Button>
      </DialogFooter>
    </Form>
  );
};

ShipForm.displayName = 'ShipForm';

const ShipDialogBody = ({ orderId }: ShipDialogBodyProps) => {
  const { data: carriers, isLoading } = useOrderShippingCarriersQuery(orderId);
  const { data: lastUsedCarrier, isLoading: isLastUsedLoading } = useLastUsedShippingCarrierQuery();

  if (isLoading || isLastUsedLoading) {
    return (
      <DialogBody>
        <Flex justify="center" cssOverride={styles.loading}>
          <Spinner />
        </Flex>
      </DialogBody>
    );
  }

  return <ShipForm carriers={carriers ?? []} lastUsedCarrier={lastUsedCarrier} />;
};

ShipDialogBody.displayName = 'ShipDialogBody';

const MarkAsShippedDialog = () => {
  const { order } = useOrderDetails();
  const { isMarkAsShippedDialogOpen, setIsMarkAsShippedDialogOpen } = useOrderAction();

  if (!isDefined(order)) {
    return null;
  }

  const orderNumber = order.order_number ?? '';
  const isPickup = order.shipping_method_type === 'local_pickup';

  const title = isPickup
    ? sprintf(
        /* translators: %s: order number */
        __('Mark %s as ready for pickup?', 'kirki-ecommerce'),
        orderNumber,
      )
    : sprintf(
        /* translators: %s: order number */
        __('Mark %s as shipped', 'kirki-ecommerce'),
        orderNumber,
      );

  return (
    <Dialog open={isMarkAsShippedDialogOpen} onOpenChange={setIsMarkAsShippedDialogOpen}>
      <DialogContent cssOverride={{ width: '440px' }}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        {isPickup ? <LocalPickup /> : <ShipDialogBody orderId={order.id} />}
      </DialogContent>
    </Dialog>
  );
};

MarkAsShippedDialog.displayName = 'MarkAsShippedDialog';

export type { MarkAsShippedPayload };

export default MarkAsShippedDialog;

const styles = defineStyles({
  loading: {
    padding: `${theme.spacing[6]} ${theme.spacing[0]}`,
  },
  addSlot: {
    gap: theme.spacing[1],
    width: '100%',
    height: '44px',
    padding: `0 ${theme.spacing[3]}`,
    border: `1px dashed ${theme.colors.background.solidSurfaceSecondary}`,
    borderRadius: theme.radius.xl,
    '&:hover': {
      border: `1px dashed ${theme.colors.background.fillSecondaryHover}`,
      backgroundColor: theme.colors.background.fillSecondaryHover,
    },
  },
  optional: {
    marginLeft: 'auto',
  },
  pickupBox: {
    padding: theme.spacing[3],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.background.surfaceSecondary,
  },
});
