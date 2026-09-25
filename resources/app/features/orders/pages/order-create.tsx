import { useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import CustomerCard from '@/features/orders/components/order-create/customer-card';
import NotesCard from '@/features/orders/components/order-create/notes-card';
import PaymentSummaryCard from '@/features/orders/components/order-create/payment-summary-card';
import ProductSelectionCard from '@/features/orders/components/order-create/product-selection-card';
import { useOrderCreate } from '@/features/orders/hooks/use-order-create';
import { SelectProductsDialog } from '@/features/products';
import { __ } from '@/wpi18n';

const OrderCreate = () => {
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
    isCalculating,
    isCreating,
    handleAddItems,
    handleQuantityChange,
    handleRemoveItem,
    handleSubmit,
  } = useOrderCreate();

  const shippingMethodId = useWatch({ control: form.control, name: 'shipping_method' });
  const draftCouponCodes = useWatch({ control: form.control, name: 'coupon_codes' });

  const selectedShippingMethodName = calculation?.available_shipping_methods.find(
    (method) => String(method.id) === shippingMethodId,
  )?.name;

  return (
    <Page containerSize="xl">
      <Form {...form}>
        <PageHeading
          text={__('Create order', 'kirki-ecommerce')}
          sticky
          actions={
            <>
              <Button variant="ghost" onClick={handleBack}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={isCreating}>
                {__('Save', 'kirki-ecommerce')}
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
                shippingMethodName={selectedShippingMethodName}
                couponCodes={draftCouponCodes?.map((coupon) => coupon.code)}
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
        </PageContent>

        {pickerOpen && (
          <SelectProductsDialog
            open
            onOpenChange={setPickerOpen}
            onAdd={handleAddItems}
            selectedProducts={selections}
            expandAll
          />
        )}
      </Form>
    </Page>
  );
};

OrderCreate.displayName = 'OrderCreate';

export default OrderCreate;
