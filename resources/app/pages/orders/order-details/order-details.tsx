import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Container from '@/components/ui/container';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Page from '@/components/ui/page';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import { ShowMoreIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import CustomerCard from '@/pages/orders/order-create/components/customer-card';
import NotesCard from '@/pages/orders/order-create/components/notes-card';
import PaymentSummaryCard from '@/pages/orders/order-create/components/payment-summary-card';
import AddTrackingDialog from '@/pages/orders/order-details/add-tracking-dialog';
import {
  getActionLabel,
  getAvailableActions,
  ORDER_ACTION_GROUP,
  ORDER_ACTIONS,
  PAYMENT_ACTION_GROUP,
  type OrderAction,
  type OrderActionPayload,
} from '@/pages/orders/order-details/config/order-actions';
import { toOrderFormAddresses } from '@/pages/orders/order-details/config/order-address';
import {
  getFulfillmentBadgeInfo,
  getPaymentBadgeInfo,
} from '@/pages/orders/order-details/config/order-badge';
import FlagCard from '@/pages/orders/order-details/flag-card';
import ItemsTable from '@/pages/orders/order-details/items-table';
import MarkAsPaidDialog from '@/pages/orders/order-details/mark-as-paid-dialog';
import TakeActionCard from '@/pages/orders/order-details/take-action-card';
import { useOrderActionMutation, useOrderQuery, useUpdateOrderMutation } from '@/services/order';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { OrderFormSchema, type OrderFormInput, type OrderFormPayload } from '@/types';
import { __, sprintf } from '@/wpi18n';

const OrderDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);

  const { data: order, isLoading, isError } = useOrderQuery(id as string, Boolean(id));
  const actionMutation = useOrderActionMutation();
  const updateMutation = useUpdateOrderMutation();

  const form = useForm<OrderFormInput, unknown, OrderFormPayload>({
    resolver: zodResolver(OrderFormSchema),
    defaultValues: { ...getDefaults(OrderFormSchema), items: [] },
  });

  useEffect(() => {
    if (!order) {
      return;
    }

    form.reset(
      pickFormValues(OrderFormSchema, order, {
        items: order.items.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        ...toOrderFormAddresses(order),
      }),
    );
  }, [order, form]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !order) {
    return (
      <Page>
        <PageHeading
          text={__('Orders', 'kirki-ecommerce')}
          type="primary"
          hasBack
          onBack={() => navigate(endpoints.ORDERS)}
          sticky
        />
        <Container>
          <Card cssOverride={{ marginTop: theme.spacing[12] }}>
            <CardContent>
              <Flex justify="center" align="center" cssOverride={{ minHeight: 200 }}>
                <Text color="secondary" variant='lead'>
                  {__('Order not found.', 'kirki-ecommerce')}
                </Text>
              </Flex>
            </CardContent>
          </Card>
        </Container>
      </Page>
    );
  }

  const paymentBadge = getPaymentBadgeInfo(order.payment_status);
  const fulfillmentBadge = getFulfillmentBadgeInfo(order.fulfillment_status);
  const orderActions = getAvailableActions(order, ORDER_ACTION_GROUP);
  const paymentActions = getAvailableActions(order, PAYMENT_ACTION_GROUP);

  const performAction = (payload: OrderActionPayload) => {
    actionMutation.mutate({ id: order.id, ...payload });
  };

  const handleAction = (action: OrderAction) => {
    if (action === ORDER_ACTIONS.ADD_TRACKING) {
      setIsTrackingDialogOpen(true);
      return;
    }

    if (action === ORDER_ACTIONS.MARK_AS_PAID) {
      setIsMarkAsPaidDialogOpen(true);
      return;
    }

    performAction({ action });
  };

  const handleAddTracking = (values: {
    carrier: string;
    tracking_number: string;
    tracking_url: string;
  }) => {
    actionMutation.mutate(
      { id: order.id, action: ORDER_ACTIONS.ADD_TRACKING, ...values },
      { onSuccess: () => setIsTrackingDialogOpen(false) },
    );
  };

  const handleMarkAsPaid = (paymentMethod: string) => {
    actionMutation.mutate(
      { id: order.id, action: ORDER_ACTIONS.MARK_AS_PAID, payment_method: paymentMethod },
      { onSuccess: () => setIsMarkAsPaidDialogOpen(false) },
    );
  };

  const handleSaveOrder = form.handleSubmit(
    async (payload) => {
      try {
        await updateMutation.mutateAsync({ id: order.id, data: payload });
      } catch (error) {
        applyServerErrors(form, error as ErrorResponse);
      }
    },
  );

  return (
    <Page>
      <Form {...form}>
        <PageHeading
          text={`${__('Order', 'kirki-ecommerce')} #${order.order_number}`}
          type="primary"
          actions={
            <>
              {/* @todo: Edit is not workable now, implement it later */}
              {/* <Button variant="ghost">
                {__('Edit', 'kirki-ecommerce')}
              </Button> */}
              {orderActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" aria-label="More options">
                      <ShowMoreIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {orderActions.map((action) => (
                      <DropdownMenuItem
                        key={action}
                        onSelect={() => handleAction(action)}
                      >
                        {getActionLabel(action)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          }
          hasBack
          sticky
        >
          <Flex gap={1}>
            <Badge variant={paymentBadge.variant}>{paymentBadge.text}</Badge>
            <Badge variant={fulfillmentBadge.variant}>{fulfillmentBadge.text}</Badge>
          </Flex>
        </PageHeading>
        <Container>
          <Flex gap={4}>
            <Flex direction="column" gap={4} cssOverride={{ width: '70%' }}>
              <Card cssOverride={cardStyles.formCard}>
                <CardHeader>
                  <CardTitle>
                    <Text variant='heading6' weight="semibold">
                      {/* translators: %s: number of items */}
                      {sprintf(__('Items (%s)', 'kirki-ecommerce'), order.items_count)}
                    </Text>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Card cssOverride={cardStyles.innerCard}>
                    <CardContent cssOverride={styles.zeroPadding}>
                      <ItemsTable items={order.items} />
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              <PaymentSummaryCard
                amounts={{
                  itemsCount: order.items_count,
                  subtotal: order.totals.base_subtotal_money_object.display,
                  discount: order.totals.base_discount_money_object.display,
                  shipping: order.totals.base_shipping_money_object.display,
                  tax: order.totals.base_tax_money_object.display,
                  total: order.totals.base_total_money_object.display,
                }}
                badge={<Badge variant={paymentBadge.variant}>{paymentBadge.text}</Badge>}
                actions={
                  paymentActions.length > 0 && (
                    <ActionGroup>
                      {paymentActions.map((action) => (
                        <Button
                          key={action}
                          variant="secondary"
                          disabled={actionMutation.isPending}
                          onClick={() => handleAction(action)}
                        >
                          {getActionLabel(action)}
                        </Button>
                      ))}
                    </ActionGroup>
                  )
                }
              />

              {/* @todo: Timeline is not workable now, implement it later */}
              {/* <Card cssOverride={cardStyles.formCard}>
                <CardHeader>
                  <CardTitle>{__('Timeline', 'kirki-ecommerce')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Timeline />
                </CardContent>
              </Card> */}
            </Flex>

            <Flex direction="column" gap={4} cssOverride={{ width: '30%' }}>
              <TakeActionCard
                order={order}
                onAction={handleAction}
                isPerforming={actionMutation.isPending}
              />

              <CustomerCard
                onSave={handleSaveOrder}
                isSaving={updateMutation.isPending}
                readonly
              />

              <FlagCard onSave={handleSaveOrder} />

              <NotesCard
                onSave={handleSaveOrder}
                isSaving={updateMutation.isPending}
              />
            </Flex>
          </Flex>
        </Container>

        {isTrackingDialogOpen && (
          <AddTrackingDialog
            open
            onOpenChange={setIsTrackingDialogOpen}
            tracking={order.shipping_tracking}
            isSaving={actionMutation.isPending}
            onSubmit={handleAddTracking}
          />
        )}

        {isMarkAsPaidDialogOpen && (
          <MarkAsPaidDialog
            open
            onOpenChange={setIsMarkAsPaidDialogOpen}
            order={order}
            isSaving={actionMutation.isPending}
            onSubmit={handleMarkAsPaid}
          />
        )}
      </Form>
    </Page>
  );
};

OrderDetails.displayName = 'OrderDetails';

export default OrderDetails;

const styles = defineStyles({
  zeroPadding: {
    padding: theme.spacing[0],
  }
});
