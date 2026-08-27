import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { RouteConfig } from '@/config/route-config';
import {
  getDisplayByVariantId,
  getOrderRows,
  mergeSelections,
} from '@/features/orders/lib/order-items';
import type { OrderFormInput, OrderFormPayload } from '@/features/orders/schemas/forms/order-form';
import { OrderCalculationRequestSchema, OrderFormSchema } from '@/features/orders/schemas/forms/order-form';
import { useCreateOrderMutation, useOrderCalculationQuery } from '@/features/orders/services/order';
import type { OrderItem } from '@/features/orders/types';
import type { ProductSelection } from '@/features/products';
import { useDebounce, useRedirect } from '@/hooks';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults } from '@/libs/zod';
import { isDefined } from '@/utils/object';

const CALCULATION_DEBOUNCE_DELAY = 500;

type UseOrderCreateResult = {
  form: UseFormReturn<OrderFormInput, unknown, OrderFormPayload>;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  selections: ProductSelection[];
  rows: OrderItem[];
  calculation: ReturnType<typeof useOrderCalculationQuery>['data'];
  isCalculating: boolean;
  isCreating: boolean;
  handleAddItems: (nextSelections: ProductSelection[]) => void;
  handleQuantityChange: (index: number, quantity: number) => void;
  handleRemoveItem: (index: number) => void;
  handleSubmit: () => void;
};

export const useOrderCreate = (): UseOrderCreateResult => {
  const redirect = useRedirect();
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
    () => getDisplayByVariantId(selections),
    [selections],
  );

  const rows = getOrderRows(pickedItems, displayByVariantId);

  const handleAddItems = (nextSelections: ProductSelection[]) => {
    replaceItems(mergeSelections(pickedItems, nextSelections));
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

  const handleSubmit = form.handleSubmit(async (payload) => {
    try {
      const response = await createMutation.mutateAsync(payload);

      if (isDefined(response.data) && isDefined(response.data.id)) {
        redirect(RouteConfig.Orders.get('OrderDetail'), { id: response.data.id }, true);
      }
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  });

  return {
    form,
    pickerOpen,
    setPickerOpen,
    selections,
    rows,
    calculation,
    isCalculating,
    isCreating: createMutation.isPending,
    handleAddItems,
    handleQuantityChange,
    handleRemoveItem,
    handleSubmit,
  };
};
