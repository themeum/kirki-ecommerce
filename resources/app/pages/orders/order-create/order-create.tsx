import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import SelectProductsDialog from '@/components/shared/select-products-dialog';
import type { ProductSelection } from '@/components/shared/select-products-dialog/types';
import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Page from '@/components/ui/page';
import PageHeading from '@/components/ui/page-heading';
import { RouteConfig } from '@/config/route-config';
import { useDebounce } from '@/hooks';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults } from '@/libs/zod';
import CustomerCard from '@/pages/orders/order-create/components/customer-card';
import NotesCard from '@/pages/orders/order-create/components/notes-card';
import PaymentSummaryCard from '@/pages/orders/order-create/components/payment-summary-card';
import ProductSelectionCard from '@/pages/orders/order-create/components/product-selection-card';
import type { OrderItem, OrderRowDisplay } from '@/pages/orders/order-create/types';
import { useCreateOrderMutation, useOrderCalculationQuery } from '@/services/order';
import {
  OrderCalculationRequestSchema,
  OrderFormSchema,
  type OrderFormInput,
  type OrderFormPayload,
} from '@/types';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const CALCULATION_DEBOUNCE_DELAY = 500;

const flattenSelections = (selections: ProductSelection[]): OrderRowDisplay[] =>
  selections.flatMap(({ productId, productTitle, variants }) =>
    variants.map((variant) => ({ ...variant, productId, productTitle })),
  );

const OrderCreate = () => {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selections, setSelections] = useState<ProductSelection[]>([]);

  const createMutation = useCreateOrderMutation();

  const form = useForm<OrderFormInput, unknown, OrderFormPayload>({
    resolver: zodResolver(OrderFormSchema),
    defaultValues: { ...getDefaults(OrderFormSchema), items: [] },
  });

  const { fields: pickedItems, update: updateItems, remove: removeItems, replace: replaceItems } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedValues = useWatch({ control: form.control });
  const debouncedValues = useDebounce(watchedValues, CALCULATION_DEBOUNCE_DELAY);
  const calculationPayload = useMemo(
    () => OrderCalculationRequestSchema.parse(debouncedValues),
    [debouncedValues],
  );
  const { data: calculation, isFetching: isCalculating } = useOrderCalculationQuery(
    calculationPayload,
    calculationPayload.items.length > 0,
  );

  const displayByVariantId = useMemo(
    () =>
      flattenSelections(selections).reduce<Record<number, OrderRowDisplay>>(
        (acc, display) => {
          acc[display.variantId] = display;
          return acc;
        },
        {},
      ),
    [selections],
  );

  const rows: OrderItem[] = pickedItems.reduce<OrderItem[]>((acc, pickedItem, index) => {
    const display = displayByVariantId[pickedItem.variant_id];

    if (display) {
      acc.push({ index, quantity: pickedItem.quantity, display });
    }

    return acc;
  }, []);

  const handleAddItems = (nextSelections: ProductSelection[]) => {
    const items = flattenSelections(nextSelections);
    const selectedVariantIds = new Set(items.map((item) => item.variantId));
    const existingVariantIds = new Set(pickedItems.map((pickedItem) => pickedItem.variant_id));

    const kept = pickedItems
      .filter((pickedItem) => selectedVariantIds.has(pickedItem.variant_id))
      .map((pickedItem) => ({ variant_id: pickedItem.variant_id, quantity: pickedItem.quantity }));

    const added = items
      .filter((item) => !existingVariantIds.has(item.variantId))
      .map((item) => ({ variant_id: item.variantId, quantity: 1 }));

    replaceItems([...kept, ...added]);

    setSelections(nextSelections);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    updateItems(index, { variant_id: pickedItems[index].variant_id, quantity });
  };

  const handleRemoveItem = (index: number) => {
    const { variant_id: variantId } = pickedItems[index];

    removeItems(index);
    setSelections((previous) =>
      previous.reduce<ProductSelection[]>((allSelectedProducts, selection) => {
        const variants = selection.variants.filter(
          (variant) => variant.variantId !== variantId,
        );

        if (variants.length > 0) {
          allSelectedProducts.push({ ...selection, variants });
        }

        return allSelectedProducts;
      }, []),
    );
  };

  const handleSubmit = async (payload: OrderFormPayload) => {
    try {
      const response = await createMutation.mutateAsync(payload);

      if (isDefined(response.data) && isDefined(response.data.id)) {
        navigate(RouteConfig.Orders.get('OrderDetail').buildLink({ id: response.data.id }));
      }
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

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
                onClick={form.handleSubmit(handleSubmit)}
                loading={createMutation.isPending}
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
