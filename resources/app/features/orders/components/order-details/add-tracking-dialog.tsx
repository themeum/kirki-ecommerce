import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

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
import NotifyCustomer from '@/features/orders/components/order-details/notify-customer';
import TrackingFields from '@/features/orders/components/order-details/tracking-fields';
import { useOrderAction } from '@/features/orders/hooks/use-order-action';
import { useOrderDetails } from '@/features/orders/hooks/use-order-details';
import {
  getInitialTrackingValues,
  isTrackingNumberAdded,
} from '@/features/orders/lib/shipping-tracking';
import type {
  LastUsedShippingCarrier,
  OrderShippingCarrier,
  OrderTracking,
} from '@/features/orders/schemas/catalog/order';
import {
  type AddTrackingFormInput,
  type AddTrackingFormPayload,
  AddTrackingFormSchema,
  OTHER_CARRIER_VALUE,
} from '@/features/orders/schemas/forms/add-tracking-form';
import {
  useLastUsedShippingCarrierQuery,
  useOrderShippingCarriersQuery,
} from '@/features/orders/services/order';
import { toTrackingTemplate } from '@/features/settings';
import { getDefaults } from '@/libs/zod';
import { useSettingsQuery } from '@/services/settings';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type AddTrackingFormProps = {
  carriers: OrderShippingCarrier[];
  lastUsedCarrier: LastUsedShippingCarrier | undefined;
};

type AddTrackingDialogBodyProps = {
  orderId: number;
};

const getInitialValues = (
  carriers: OrderShippingCarrier[],
  tracking: OrderTracking,
  lastUsedCarrier: LastUsedShippingCarrier | undefined,
): AddTrackingFormInput => {
  const defaults = getDefaults(AddTrackingFormSchema);
  const storedName = tracking.carrier?.trim() ?? '';
  const trackingNumber = tracking.tracking_number ?? '';

  if (!storedName) {
    return { ...defaults, ...getInitialTrackingValues(carriers, lastUsedCarrier) };
  }

  const matchedCarrier = carriers.find((carrier) => carrier.name === storedName);

  if (matchedCarrier) {
    return { ...defaults, carrier: matchedCarrier.id, tracking_number: trackingNumber };
  }

  return {
    ...defaults,
    carrier: OTHER_CARRIER_VALUE,
    tracking_number: trackingNumber,
    other_name: storedName,
    other_url: toTrackingTemplate(tracking.tracking_url ?? '', trackingNumber),
  };
};

const AddTrackingForm = ({ carriers, lastUsedCarrier }: AddTrackingFormProps) => {
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const { order } = useOrderDetails();
  const { isActionPending, setIsTrackingDialogOpen, handleAddTracking, handleRemoveTracking } =
    useOrderAction();
  const { data: emailSettings } = useSettingsQuery('email');

  const isTrackingAddedNotificationEnabled = useMemo(() => {
    if (
      !isDefined(emailSettings) ||
      !isDefined(emailSettings.customer_emails) ||
      !isDefined(emailSettings.customer_emails.order_notifications) ||
      !isDefined(emailSettings.customer_emails.order_notifications.tracking_added)
    ) {
      return false;
    }

    return emailSettings.customer_emails.order_notifications.tracking_added.is_enabled;
  }, [emailSettings]);

  const form = useForm<AddTrackingFormInput, unknown, AddTrackingFormPayload>({
    resolver: zodResolver(AddTrackingFormSchema),
    defaultValues: getInitialValues(carriers, order?.shipping_tracking ?? {}, lastUsedCarrier),
    mode: 'onChange',
  });

  const isEditing = isDefined(order) && isTrackingNumberAdded(order.shipping_tracking);

  useEffect(() => {
    if (isTrackingAddedNotificationEnabled) {
      setNotifyCustomer(true);
    }
  }, [isTrackingAddedNotificationEnabled]);

  return (
    <Form {...form}>
      <DialogBody>
        <TrackingFields carriers={carriers} />
        {isTrackingAddedNotificationEnabled && (
          <NotifyCustomer
            label={__('Email the customer the tracking details', 'kirki-ecommerce')}
            value={notifyCustomer}
            onChange={setNotifyCustomer}
          />
        )}
      </DialogBody>
      <DialogFooter cssOverride={mergeCss(isEditing && { justifyContent: 'space-between' })}>
        {isEditing && (
          <Button
            variant="link"
            cssOverride={{
              color: theme.colors.text.critical,
              '&:hover': { color: theme.colors.text.critical },
            }}
            disabled={isActionPending}
            onClick={handleRemoveTracking}
          >
            {__('Remove tracking', 'kirki-ecommerce')}
          </Button>
        )}
        <Flex justify="flex-end" gap={2}>
          <Button variant="ghost" onClick={() => setIsTrackingDialogOpen(false)}>
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button
            variant="primary"
            disabled={!form.formState.isValid}
            loading={isActionPending}
            onClick={form.handleSubmit(handleAddTracking)}
          >
            {__('Save', 'kirki-ecommerce')}
          </Button>
        </Flex>
      </DialogFooter>
    </Form>
  );
};

AddTrackingForm.displayName = 'AddTrackingForm';

const AddTrackingDialogBody = ({ orderId }: AddTrackingDialogBodyProps) => {
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

  return <AddTrackingForm carriers={carriers ?? []} lastUsedCarrier={lastUsedCarrier} />;
};

AddTrackingDialogBody.displayName = 'AddTrackingDialogBody';

const AddTrackingDialog = () => {
  const { order } = useOrderDetails();
  const { isTrackingDialogOpen, setIsTrackingDialogOpen } = useOrderAction();

  if (!isDefined(order)) {
    return null;
  }

  return (
    <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
      <DialogContent cssOverride={{ width: '520px' }}>
        <DialogHeader>
          <DialogTitle>
            {isTrackingNumberAdded(order.shipping_tracking)
              ? __('Edit tracking', 'kirki-ecommerce')
              : __('Add tracking', 'kirki-ecommerce')}
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <AddTrackingDialogBody orderId={order.id} />
      </DialogContent>
    </Dialog>
  );
};

AddTrackingDialog.displayName = 'AddTrackingDialog';

export default AddTrackingDialog;

const styles = defineStyles({
  loading: {
    padding: `${theme.spacing[6]} 0`,
  },
});
