import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Page from '@/components/ui/page';
import PageHeading from '@/components/ui/page-heading';
import { RouteConfig } from '@/config/route-config';
import { useOrderCreate } from '@/features/orders/hooks/use-order-create';
import CustomerCard from '@/features/orders/pages/order-create/components/customer-card';
import NotesCard from '@/features/orders/pages/order-create/components/notes-card';
import PaymentSummaryCard from '@/features/orders/pages/order-create/components/payment-summary-card';
import ProductSelectionCard from '@/features/orders/pages/order-create/components/product-selection-card';
import { SelectProductsDialog } from '@/features/products';
import { __ } from '@/wpi18n';

const OrderCreate = () => {
  const navigate = useNavigate();

  const {
    form,
    pickerOpen,
    setPickerOpen,
    selections,
    rows,
    calculation,
    isCalculating,
    isCreating,
    handleAddItems,
    handleQuantityChange,
    handleRemoveItem,
    handleSubmit,
  } = useOrderCreate();

  return (
    <Page>
      <Form {...form}>
        <PageHeading
          text={__('Create order', 'kirki-ecommerce')}
          type="primary"
          actions={
            <>
              <Button variant="ghost" onClick={() => navigate(RouteConfig.Orders.buildLink())}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={isCreating}
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </>
          }
          hasBack
          onBack={() => navigate(RouteConfig.Orders.buildLink())}
          sticky
        />
        <Container>
          <Flex gap={4}>
            <Flex direction="column" gap={4} cssOverride={{ width: '70%' }}>
              <ProductSelectionCard
                rows={rows}
                calculationItems={calculation?.items}
                onOpenPicker={() => setPickerOpen(true)}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
              />
              <PaymentSummaryCard
                amounts={{
                  itemsCount: calculation?.items_count,
                  subtotal: calculation?.pricing.base_subtotal_money_object.display,
                  discount: calculation?.pricing.base_discount_total_money_object.display,
                  shipping: calculation?.pricing.base_shipping_total_money_object.display,
                  tax: calculation?.pricing.base_tax_total_money_object.display,
                  total: calculation?.pricing.base_total_money_object.display,
                }}
                availableShippingMethods={calculation?.available_shipping_methods}
                isCalculating={isCalculating}
                isDiscountEditable
                isShippingEditable
              />
            </Flex>

            <Flex direction="column" gap={4} cssOverride={{ width: '30%' }}>
              <CustomerCard />
              <NotesCard />
            </Flex>
          </Flex>
        </Container>

        {pickerOpen && (
          <SelectProductsDialog
            open
            onOpenChange={setPickerOpen}
            onAdd={handleAddItems}
            selectedProducts={selections}
          />
        )}
      </Form>
    </Page>
  );
};

OrderCreate.displayName = 'OrderCreate';

export default OrderCreate;
