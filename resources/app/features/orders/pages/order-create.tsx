import { useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Page, PAGE_HEADING_HEIGHT, PageContent, PageHeading } from '@/components/ui/page';
import CustomerCard from '@/features/orders/components/order-create/customer-card';
import NotesCard from '@/features/orders/components/order-create/notes-card';
import PaymentSummaryCard from '@/features/orders/components/order-create/payment-summary-card';
import ProductSelectionCard from '@/features/orders/components/order-create/product-selection-card';
import { OrderCreateProvider } from '@/features/orders/contexts/order-create-context';
import { useOrderCreate } from '@/features/orders/hooks/use-order-create';
import { SelectProductsDialog } from '@/features/products';
import { theme } from '@/theme';
import { __ } from '@/wpi18n';

const OrderCreateContent = () => {
  const navigate = useNavigate();
  const handleBack = () => {
    void navigate(-1);
  };

  const {
    form,
    pickerOpen,
    setPickerOpen,
    selections,
    calculation,
    isCalculating,
    isCreating,
    handleAddItems,
    handleQuantityChange,
    handleRemoveItem,
    handleSubmit,
  } = useOrderCreate();

  const shippingMethodId = useWatch({ control: form.control, name: 'shipping_method' });

  const selectedShippingMethodName = calculation?.available_shipping_methods.find(
    (method) => String(method.id) === shippingMethodId,
  )?.name;

  return (
    <Page containerSize="xl">
      <Form {...form}>
        <PageHeading
          text={__('New order', 'kirki-ecommerce')}
          sticky
          actions={
            <>
              <Button variant="ghost" onClick={handleBack}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={isCreating}>
                {__('Create Order', 'kirki-ecommerce')}
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
              <PaymentSummaryCard
                totals={calculation?.totals}
                coupons={calculation?.coupons}
                taxLines={calculation?.tax_lines}
                itemsCount={calculation?.items_count}
                availableShippingMethods={calculation?.available_shipping_methods}
                shippingMethodName={selectedShippingMethodName}
                isCalculating={isCalculating}
                isDiscountEditable
                isShippingEditable
              />
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
              <CustomerCard />
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

OrderCreateContent.displayName = 'OrderCreateContent';

const OrderCreate = () => {
  return (
    <OrderCreateProvider>
      <OrderCreateContent />
    </OrderCreateProvider>
  );
};

OrderCreate.displayName = 'OrderCreate';

export default OrderCreate;
