import { zodResolver } from '@hookform/resolvers/zod';
import { createContext, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { RouteConfig } from '@/config/route-config';
import { toOrderFormAddresses } from '@/features/orders/lib/order-address';
import {
  getDisplayByVariantId,
  getOrderRows,
  getStoredDisplayByVariantId,
  mergeSelections,
  pairCalculationItems,
  toSelectedCoupon,
} from '@/features/orders/lib/order-items';
import type {
  OrderCalculation,
  OrderCalculationItem,
  OrderEditInfo,
  OrderShippingMethod,
} from '@/features/orders/schemas/catalog/order';
import type {
  OrderCalculationRequestPayload,
  OrderFormInput,
  OrderFormPayload,
} from '@/features/orders/schemas/forms/order-form';
import {
  OrderCalculationRequestSchema,
  OrderFormSchema,
} from '@/features/orders/schemas/forms/order-form';
import {
  useCreateOrderMutation,
  useOrderCalculationQuery,
  useOrderEditInfoQuery,
  useUpdateOrderMutation,
} from '@/features/orders/services/order';
import type { OrderItem, PaymentSummary } from '@/features/orders/types';
import type { ProductSelection } from '@/features/products';
import { useDebounce } from '@/hooks';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { toastMutationError } from '@/services/helpers';
import { isDefined } from '@/utils/object';
import { _n, sprintf } from '@/wpi18n';

const CALCULATION_DEBOUNCE_DELAY = 500;

export type OrderEditContextValue = {
  form: UseFormReturn<OrderFormInput, unknown, OrderFormPayload>;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  selections: ProductSelection[];
  rows: OrderItem[];
  calculation?: OrderCalculation;
  paymentSummary: PaymentSummary;
  availableShippingMethods: OrderShippingMethod[];
  calculationItems: (OrderCalculationItem | undefined)[];
  isCalculating: boolean;
  isSaving: boolean;
  isEdit: boolean;
  order?: OrderEditInfo;
  isOrderLoading: boolean;
  isOrderError: boolean;
  orderError: ErrorResponse | null;
  isOrderFetching: boolean;
  refetchOrder: () => void;
  rejectedCouponCodes: string[];
  handleAddItems: (nextSelections: ProductSelection[]) => void;
  handleQuantityChange: (index: number, quantity: number) => void;
  handleRemoveItem: (index: number) => void;
  handleSubmit: () => void;
};

const OrderEditContext = createContext<OrderEditContextValue | null>(null);

type OrderEditProviderProps = {
  children: ReactNode;
  orderId?: number;
};

const OrderEditProvider = ({ children, orderId }: OrderEditProviderProps) => {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selections, setSelections] = useState<ProductSelection[]>([]);
  const isEdit = isDefined(orderId);

  const createMutation = useCreateOrderMutation();
  const updateMutation = useUpdateOrderMutation();
  const {
    data: order,
    isLoading: isOrderLoading,
    isError: isOrderError,
    error: orderError,
    isFetching: isOrderFetching,
    refetch,
  } = useOrderEditInfoQuery(orderId ?? '', isEdit);

  const form = useForm<OrderFormInput, unknown, OrderFormPayload>({
    resolver: zodResolver(OrderFormSchema),
    defaultValues: { ...getDefaults(OrderFormSchema), items: [] },
  });

  const {
    fields: pickedItems,
    update: updateItems,
    remove: removeItems,
    replace: replaceItems,
  } = useFieldArray({
    control: form.control,
    name: 'items',
    keyName: 'key',
  });

  const isFormFilledRef = useRef(false);
  const isApplyingCorrectionRef = useRef(false);
  const pendingCouponCorrectionRef = useRef<string[] | null>(null);
  const lastValidValuesRef = useRef<OrderFormInput | null>(null);
  const lastValidSelectionsRef = useRef<ProductSelection[]>([]);
  const [rejectedCouponCodes, setRejectedCouponCodes] = useState<string[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({});
  const [availableShippingMethods, setAvailableShippingMethods] = useState<OrderShippingMethod[]>(
    [],
  );

  const values = useWatch({
    control: form.control,
  });

  const calculationPayload = useMemo(() => OrderCalculationRequestSchema.parse(values), [values]);
  const [calculationRequest, setCalculationRequest] =
    useState<OrderCalculationRequestPayload | null>(null);

  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ name, values }) => {
          if (isDefined(name) && ['order_notes', 'flags', 'is_manual'].includes(name)) {
            return;
          }

          if (isApplyingCorrectionRef.current) {
            return;
          }

          setCalculationRequest(OrderCalculationRequestSchema.parse(values));
        },
      }),
    [form],
  );

  useEffect(() => {
    if (!isDefined(order) || !order.is_editable || isFormFilledRef.current) {
      return;
    }

    isFormFilledRef.current = true;
    isApplyingCorrectionRef.current = true;

    form.reset(
      pickFormValues(OrderFormSchema, order, {
        order_id: order.id,
        items: order.items.map((item) => ({
          id: item.id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        coupon_codes: order.coupons.map(toSelectedCoupon),
        ...toOrderFormAddresses(order),
      }),
    );

    setPaymentSummary({
      totals: order.totals,
      coupons: order.coupons,
      taxLines: order.tax_lines,
      itemsCount: order.items_count,
      isTaxInclusive: order.is_tax_inclusive,
      shippingMethodName: order.shipping_method_name,
    });
    setAvailableShippingMethods(order.available_shipping_methods);
    lastValidValuesRef.current = form.getValues();

    isApplyingCorrectionRef.current = false;
  }, [order, form]);

  const debouncedCalculationRequest = useDebounce(calculationRequest, CALCULATION_DEBOUNCE_DELAY);

  const {
    data: calculation,
    isFetching: isCalculating,
    error: calculationError,
    errorUpdatedAt: calculationErrorUpdatedAt,
  } = useOrderCalculationQuery(
    debouncedCalculationRequest ?? calculationPayload,
    isDefined(debouncedCalculationRequest),
  );

  const applyCorrection = (correct: () => void) => {
    isApplyingCorrectionRef.current = true;
    correct();
    isApplyingCorrectionRef.current = false;
  };

  useEffect(() => {
    if (!calculationError) {
      return;
    }

    toastMutationError(calculationError);

    const lastValidValues = lastValidValuesRef.current;

    if (!isDefined(lastValidValues)) {
      return;
    }

    applyCorrection(() => form.reset(lastValidValues));
    setSelections(lastValidSelectionsRef.current);
    setCalculationRequest(OrderCalculationRequestSchema.parse(lastValidValues));
    // Revert must run once per failed request, not whenever `form` identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculationError, calculationErrorUpdatedAt]);

  const calculationItems = pairCalculationItems(pickedItems, calculation?.items ?? []);

  useEffect(() => {
    if (!isDefined(calculation)) {
      return;
    }

    pickedItems.forEach((pickedItem, index) => {
      const calculationItem = calculationItems[index];

      if (calculationItem && calculationItem.quantity !== pickedItem.quantity) {
        applyCorrection(() =>
          form.setValue(`items.${index}.quantity`, calculationItem.quantity, {
            shouldValidate: false,
            shouldDirty: false,
          }),
        );
      }
    });

    const submittedCoupons = form.getValues('coupon_codes') ?? [];
    const submittedCodes = submittedCoupons
      .map((coupon) => coupon.code)
      .filter((code): code is string => isDefined(code));

    const pendingCouponCorrection = pendingCouponCorrectionRef.current;
    const isExpectedCouponCorrectionEcho =
      pendingCouponCorrection !== null &&
      pendingCouponCorrection.length === submittedCodes.length &&
      pendingCouponCorrection.every((code, index) => code === submittedCodes[index]);

    if (isExpectedCouponCorrectionEcho) {
      pendingCouponCorrectionRef.current = null;
    } else {
      const acceptedCodes = new Set(calculation.coupons.map((coupon) => coupon.code));
      const rejectedCodes = submittedCodes.filter((code) => !acceptedCodes.has(code));

      if (rejectedCodes.length > 0) {
        const correctedCoupons = submittedCoupons.filter(
          (coupon) => !rejectedCodes.includes(coupon.code ?? ''),
        );

        applyCorrection(() =>
          form.setValue('coupon_codes', correctedCoupons, {
            shouldValidate: false,
            shouldDirty: false,
          }),
        );
        setRejectedCouponCodes(rejectedCodes);
        toast.error(
          sprintf(
            _n(
              '"%s" discount code isn\'t valid for the items in your cart.',
              '"%s" discount codes aren\'t valid for the items in your cart.',
              rejectedCodes.length,
              'kirki-ecommerce',
            ),
            rejectedCodes.join('", "'),
          ),
        );
        pendingCouponCorrectionRef.current = correctedCoupons
          .map((coupon) => coupon.code)
          .filter((code): code is string => isDefined(code));
      } else {
        setRejectedCouponCodes([]);
        pendingCouponCorrectionRef.current = null;
      }
    }

    const submittedShippingMethod = form.getValues('shipping_method');

    if (
      isDefined(calculation.shipping_method) &&
      String(calculation.shipping_method) !== submittedShippingMethod
    ) {
      applyCorrection(() =>
        form.setValue('shipping_method', String(calculation.shipping_method), {
          shouldValidate: false,
          shouldDirty: false,
        }),
      );
    }

    setPaymentSummary({
      totals: calculation.totals,
      coupons: calculation.coupons,
      taxLines: calculation.tax_lines,
      itemsCount: calculation.items_count,
      isTaxInclusive: calculation.is_tax_inclusive,
      shippingMethodName: calculation.available_shipping_methods.find(
        (method) => String(method.id) === String(calculation.shipping_method),
      )?.name,
    });
    setAvailableShippingMethods(calculation.available_shipping_methods);
    lastValidValuesRef.current = form.getValues();
    lastValidSelectionsRef.current = selections;

    // Reconciliation must run only when a new calculation result arrives, reading the
    // current form state fresh each time - re-running it for every keystroke that
    // changes `pickedItems`/`form` identity would fight the user's own edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculation]);

  const displayByVariantId = useMemo(
    () => ({
      ...getStoredDisplayByVariantId(order?.items ?? []),
      ...getDisplayByVariantId(selections),
    }),
    [order, selections],
  );

  const rows = getOrderRows(pickedItems, displayByVariantId);

  const handleAddItems = (nextSelections: ProductSelection[]) => {
    replaceItems(mergeSelections(pickedItems, nextSelections));
    setSelections(nextSelections);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const { id, variant_id: variantId } = pickedItems[index];

    updateItems(
      index,
      isDefined(id) ? { id, variant_id: variantId, quantity } : { variant_id: variantId, quantity },
    );
  };

  const handleRemoveItem = (index: number) => {
    const { variant_id: variantId } = pickedItems[index];

    removeItems(index);
    setSelections((previous) =>
      previous.reduce<ProductSelection[]>((allSelectedProducts, selection) => {
        const variants = selection.variants.filter((variant) => variant.variantId !== variantId);

        if (variants.length > 0) {
          allSelectedProducts.push({ ...selection, variants });
        }

        return allSelectedProducts;
      }, []),
    );
  };

  const handleSubmit = form.handleSubmit(async (payload) => {
    try {
      if (!isEdit) {
        const response = await createMutation.mutateAsync(payload);

        if (isDefined(response.data) && isDefined(response.data.id)) {
          void navigate(RouteConfig.Orders.get('OrderDetail').buildLink({ id: response.data.id }), {
            replace: true,
          });
        }
        return;
      }

      if (!isDefined(order)) {
        return;
      }

      await updateMutation.mutateAsync({ id: order.id, data: payload });
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  });

  const value: OrderEditContextValue = {
    form,
    pickerOpen,
    setPickerOpen,
    selections,
    rows,
    calculation,
    paymentSummary,
    availableShippingMethods,
    calculationItems,
    isCalculating,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isEdit,
    order,
    isOrderLoading,
    isOrderError,
    orderError: orderError as ErrorResponse | null,
    isOrderFetching,
    refetchOrder: () => void refetch(),
    rejectedCouponCodes,
    handleAddItems,
    handleQuantityChange,
    handleRemoveItem,
    handleSubmit,
  };

  return <OrderEditContext.Provider value={value}>{children}</OrderEditContext.Provider>;
};

OrderEditProvider.displayName = 'OrderEditProvider';

export { OrderEditContext, OrderEditProvider };
