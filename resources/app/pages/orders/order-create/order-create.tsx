import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Page from '@/components/ui/page';
import PageHeading from '@/components/ui/page-heading';
import { useDebounce } from '@/hooks';
import type { ErrorResponse } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults } from '@/libs/zod';
import CustomerCard from '@/pages/orders/order-create/components/customer-card';
import NotesCard from '@/pages/orders/order-create/components/notes-card';
import PaymentSummaryCard from '@/pages/orders/order-create/components/payment-summary-card';
import ProductSelectionCard from '@/pages/orders/order-create/components/product-selection-card';
import SelectProductsDialog from '@/pages/orders/order-create/components/select-products-dialog';
import type { OrderItemRow, OrderRowDisplay } from '@/pages/orders/order-create/types';
import { useCreateOrderMutation, useOrderCalculationQuery } from '@/services/order';
import {
  OrderCalculationRequestSchema,
  OrderFormSchema,
  type OrderFormInput,
  type OrderFormPayload,
} from '@/types';
import { __ } from '@/wpi18n';

const CALCULATION_DEBOUNCE_DELAY = 500;

const OrderCreate = () => {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lineDetails, setLineDetails] = useState<Record<number, OrderRowDisplay>>({});

  const createMutation = useCreateOrderMutation();

  const form = useForm<OrderFormInput, unknown, OrderFormPayload>({
    resolver: zodResolver(OrderFormSchema),
    defaultValues: { ...getDefaults(OrderFormSchema), items: [] },
  });

  const { fields: pickedItems, update, remove, replace } = useFieldArray({
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

  const rows: OrderItemRow[] = pickedItems.reduce<OrderItemRow[]>((acc, pickedItem, index) => {
    const display = lineDetails[pickedItem.variant_id];

    if (display) {
      acc.push({ index, quantity: pickedItem.quantity, display });
    }

    return acc;
  }, []);

  const handleAddItems = (items: OrderRowDisplay[]) => {
    const selectedVariantIds = new Set(items.map((item) => item.variantId));
    const existingVariantIds = new Set(pickedItems.map((pickedItem) => pickedItem.variant_id));

    const kept = pickedItems
      .filter((pickedItem) => selectedVariantIds.has(pickedItem.variant_id))
      .map((pickedItem) => ({ variant_id: pickedItem.variant_id, quantity: pickedItem.quantity }));

    const added = items
      .filter((item) => !existingVariantIds.has(item.variantId))
      .map((item) => ({ variant_id: item.variantId, quantity: 1 }));

    replace([...kept, ...added]);

    setLineDetails(
      items.reduce<Record<number, OrderRowDisplay>>((acc, item) => {
        acc[item.variantId] = item;
        return acc;
      }, {}),
    );
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    update(index, { variant_id: pickedItems[index].variant_id, quantity });
  };

  const handleRemoveItem = (index: number) => {
    const { variant_id: variantId } = pickedItems[index];

    remove(index);
    setLineDetails((previous) => {
      const next = { ...previous };
      delete next[variantId];
      return next;
    });
  };

  const handleSubmit = async (payload: OrderFormPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      navigate(endpoints.ORDERS);
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
              <Button variant="ghost" onClick={() => navigate(endpoints.ORDERS)}>
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
                calculation={calculation}
                isCalculating={isCalculating}
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
            selectedLines={rows.map((row) => row.display)}
          />
        )}
      </Form>
    </Page>
  );
};

OrderCreate.displayName = 'OrderCreate';

export default OrderCreate;
