import { useNavigate, useParams } from 'react-router';

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
import CustomerCard from '@/features/orders/components/order-create/customer-card';
import NotesCard from '@/features/orders/components/order-create/notes-card';
import PaymentSummaryCard from '@/features/orders/components/order-create/payment-summary-card';
import AddTrackingDialog from '@/features/orders/components/order-details/add-tracking-dialog';
import FlagCard from '@/features/orders/components/order-details/flag-card';
import ItemsTable from '@/features/orders/components/order-details/items-table';
import MarkAsPaidDialog from '@/features/orders/components/order-details/mark-as-paid-dialog';
import TakeActionCard from '@/features/orders/components/order-details/take-action-card';
import Timeline from '@/features/orders/components/order-details/timeline';
import { useOrderDetails } from '@/features/orders/hooks/use-order-details';
import { getActionLabel } from '@/features/orders/lib/order-actions';
import OrderDetailsSkeleton from '@/features/orders/skeletons/order-details-skeleton';
import { ShowMoreIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    void navigate(-1);
  };

  const {
    order,
    isLoading,
    isError,
    form,
    paymentBadge,
    fulfillmentBadge,
    orderActions,
    paymentActions,
    isActionPending,
    isSaving,
    isTrackingDialogOpen,
    setIsTrackingDialogOpen,
    isMarkAsPaidDialogOpen,
    setIsMarkAsPaidDialogOpen,
    handleAction,
    handleAddTracking,
    handleMarkAsPaid,
    handleSaveOrder,
  } = useOrderDetails(id);

  if (isLoading) {
    return <OrderDetailsSkeleton />;
  }

  if (isError || !order || !paymentBadge || !fulfillmentBadge) {
    return (
      <Page>
        <PageHeading
          text={__('Orders', 'kirki-ecommerce')}
          type="primary"
          hasBack
          onBack={handleBack}
          sticky
        />
        <Container>
          <Card cssOverride={{ marginTop: theme.spacing[12] }}>
            <CardContent>
              <Flex justify="center" align="center" cssOverride={{ minHeight: 200 }}>
                <Text color="secondary" variant="lead">
                  {__('Order not found.', 'kirki-ecommerce')}
                </Text>
              </Flex>
            </CardContent>
          </Card>
        </Container>
      </Page>
    );
  }

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
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={__('More options', 'kirki-ecommerce')}
                    >
                      <ShowMoreIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {orderActions.map((action) => (
                      <DropdownMenuItem key={action} onSelect={() => handleAction(action)}>
                        {getActionLabel(action)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          }
          hasBack
          onBack={handleBack}
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
                    <Text variant="heading6" weight="semibold">
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
                shippingMethodName={order.shipping_method_name}
                couponCode={order.totals.discount_details?.code}
                badge={<Badge variant={paymentBadge.variant}>{paymentBadge.text}</Badge>}
                actions={
                  paymentActions.length > 0 && (
                    <ActionGroup>
                      {paymentActions.map((action) => (
                        <Button
                          key={action}
                          variant="secondary"
                          disabled={isActionPending}
                          onClick={() => handleAction(action)}
                        >
                          {getActionLabel(action)}
                        </Button>
                      ))}
                    </ActionGroup>
                  )
                }
              />

              <Timeline orderId={order.id} />
            </Flex>

            <Flex direction="column" gap={4} cssOverride={{ width: '30%' }}>
              <TakeActionCard
                order={order}
                onAction={handleAction}
                isPerforming={isActionPending}
              />

              <CustomerCard onSave={handleSaveOrder} isSaving={isSaving} readonly />

              <FlagCard onSave={handleSaveOrder} />

              <NotesCard onSave={handleSaveOrder} isSaving={isSaving} />
            </Flex>
          </Flex>
        </Container>

        {isTrackingDialogOpen && (
          <AddTrackingDialog
            open
            onOpenChange={setIsTrackingDialogOpen}
            tracking={order.shipping_tracking}
            isSaving={isActionPending}
            onSubmit={handleAddTracking}
          />
        )}

        {isMarkAsPaidDialogOpen && (
          <MarkAsPaidDialog
            open
            onOpenChange={setIsMarkAsPaidDialogOpen}
            order={order}
            isSaving={isActionPending}
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
  },
});
