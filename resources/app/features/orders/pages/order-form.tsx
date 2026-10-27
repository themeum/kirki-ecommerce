import { useNavigate, useParams } from 'react-router';

import Button from '@/components/ui/button';
import ErrorState from '@/components/ui/error-state';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Page, PAGE_HEADING_HEIGHT, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import { RouteConfig } from '@/config/route-config';
import FlagCard from '@/features/orders/components/order-details/flag-card';
import Timeline from '@/features/orders/components/order-details/timeline';
import CustomerCard from '@/features/orders/components/order-form/customer-card';
import NotesCard from '@/features/orders/components/order-form/notes-card';
import PaymentSummaryCard from '@/features/orders/components/order-form/payment-summary-card';
import ProductSelectionCard from '@/features/orders/components/order-form/product-selection-card';
import { OrderEditProvider } from '@/features/orders/contexts/order-edit-context';
import { useOrderEdit } from '@/features/orders/hooks/use-order-edit';
import OrderDetailsSkeleton from '@/features/orders/skeletons/order-details-skeleton';
import { SelectProductsDialog } from '@/features/products';
import { theme } from '@/theme';
import { isDefined } from '@/utils/object';
import { __, sprintf } from '@/wpi18n';

const OrderFormContent = () => {
  const navigate = useNavigate();
  const handleBack = () => {
    void navigate(-1);
  };

  const {
    form,
    pickerOpen,
    setPickerOpen,
    selections,
    rows,
    calculation,
    paymentSummary,
    isCalculating,
    isSaving,
    isEdit,
    order,
    isOrderLoading,
    isOrderError,
    isOrderFetching,
    refetchOrder,
    handleAddItems,
    handleQuantityChange,
    handleRemoveItem,
    handleSubmit,
  } = useOrderEdit();

  if (isEdit && isOrderLoading) {
    return <OrderDetailsSkeleton />;
  }

  if (isEdit && (isOrderError || !order)) {
    return (
      <Page containerSize="xl">
        <PageHeading
          sticky
          text={__('Edit order', 'kirki-ecommerce')}
          hasBack
          onBack={handleBack}
        />
        <PageContent>
          <QueryErrorState onRetry={refetchOrder} isRetrying={isOrderFetching} />
        </PageContent>
      </Page>
    );
  }

  if (isEdit && order && !order.is_editable) {
    return (
      <Page containerSize="xl">
        <PageHeading
          sticky
          text={__('Edit order', 'kirki-ecommerce')}
          hasBack
          onBack={handleBack}
        />
        <PageContent>
          <ErrorState
            title={__("This order can't be edited", 'kirki-ecommerce')}
            description={__(
              'Only unpaid orders that are not cancelled or shipped can be edited.',
              'kirki-ecommerce',
            )}
            actions={
              <Button
                variant="secondary"
                onClick={() =>
                  void navigate(RouteConfig.Orders.get('OrderDetail').buildLink({ id: order.id }), {
                    replace: true,
                  })
                }
              >
                {__('Back to order', 'kirki-ecommerce')}
              </Button>
            }
          />
        </PageContent>
      </Page>
    );
  }

  return (
    <Page containerSize="xl">
      <Form {...form}>
        <PageHeading
          text={
            isEdit
              ? sprintf(
                  /* translators: %s: order number */
                  __('Edit order %s', 'kirki-ecommerce'),
                  order?.order_number ?? '',
                )
              : __('New order', 'kirki-ecommerce')
          }
          sticky
          actions={
            <>
              <Button variant="ghost" onClick={handleBack}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={isSaving}
                disabled={isCalculating || isOrderFetching}
              >
                {isEdit
                  ? __('Update Order', 'kirki-ecommerce')
                  : __('Create Order', 'kirki-ecommerce')}
              </Button>
            </>
          }
          hasBack
          onBack={handleBack}
        />
        <PageContent>
          <Flex gap={4}>
            <Flex direction="column" gap={4} cssOverride={{ width: '70%' }}>
              <ProductSelectionCard
                onOpenPicker={() => setPickerOpen(true)}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
              />
              {rows.length > 0 && (
                <PaymentSummaryCard
                  {...paymentSummary}
                  availableShippingMethods={calculation?.available_shipping_methods}
                  isCalculating={isCalculating}
                  isDiscountEditable
                  isShippingEditable
                />
              )}
              {isEdit && order && <Timeline orderId={order.id} />}
            </Flex>

            <Flex
              direction="column"
              gap={4}
              cssOverride={{
                width: '30%',
                position: 'sticky',
                top: `calc(${PAGE_HEADING_HEIGHT} + ${theme.spacing[8]})`,
                alignSelf: 'flex-start',
              }}
            >
              <CustomerCard mode={isEdit ? 'edit' : 'create'} />
              {isEdit && <FlagCard />}
              <NotesCard />
            </Flex>
          </Flex>
        </PageContent>

        {pickerOpen && (
          <SelectProductsDialog
            open
            onOpenChange={setPickerOpen}
            onAdd={handleAddItems}
            selectedProducts={selections}
            mode="order"
            expandAll
          />
        )}
      </Form>
    </Page>
  );
};

OrderFormContent.displayName = 'OrderFormContent';

const OrderForm = () => {
  const { id } = useParams();

  return (
    <OrderEditProvider orderId={isDefined(id) ? Number(id) : id}>
      <OrderFormContent />
    </OrderEditProvider>
  );
};

OrderForm.displayName = 'OrderForm';

export default OrderForm;
