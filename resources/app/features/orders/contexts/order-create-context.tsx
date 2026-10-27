import { zodResolver } from '@hookform/resolvers/zod';
import { createContext, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { RouteConfig } from '@/config/route-config';
import {
  getDisplayByVariantId,
  getOrderRows,
  mergeSelections,
} from '@/features/orders/lib/order-items';
import type {
  OrderCalculation,
  OrderCalculationItem,
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
import { useCreateOrderMutation, useOrderCalculationQuery } from '@/features/orders/services/order';
import type { OrderItem } from '@/features/orders/types';
import type { ProductSelection } from '@/features/products';
import { useDebounce } from '@/hooks';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults } from '@/libs/zod';
import { isDefined } from '@/utils/object';
import { _n, sprintf } from '@/wpi18n';

const CALCULATION_DEBOUNCE_DELAY = 500;

export type OrderCreateContextValue = {
  form: UseFormReturn<OrderFormInput, unknown, OrderFormPayload>;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  selections: ProductSelection[];
  rows: OrderItem[];
  calculation?: OrderCalculation;
  calculationItemById: Map<number, OrderCalculationItem>;
  isCalculating: boolean;
  isCreating: boolean;
  rejectedCouponCodes: string[];
  handleAddItems: (nextSelections: ProductSelection[]) => void;
  handleQuantityChange: (index: number, quantity: number) => void;
  handleRemoveItem: (index: number) => void;
  handleSubmit: () => void;
};

const OrderCreateContext = createContext<OrderCreateContextValue | null>(null);

type OrderCreateProviderProps = {
  children: ReactNode;
};

const OrderCreateProvider = ({ children }: OrderCreateProviderProps) => {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selections, setSelections] = useState<ProductSelection[]>([]);

  const createMutation = useCreateOrderMutation();

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
  });

  const isApplyingCorrectionRef = useRef(false);
  const pendingCouponCorrectionRef = useRef<string[] | null>(null);
  const [rejectedCouponCodes, setRejectedCouponCodes] = useState<string[]>([]);

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
          if (
            isDefined(name) &&
            ['order_notes', 'flags', 'is_manual'].includes(name)
          ) {
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

  const debouncedCalculationRequest = useDebounce(calculationRequest, CALCULATION_DEBOUNCE_DELAY);

  const { data: calculation, isFetching: isCalculating } = useOrderCalculationQuery(
    debouncedCalculationRequest ?? calculationPayload,
    isDefined(debouncedCalculationRequest),
  );

  const applyCorrection = (correct: () => void) => {
    isApplyingCorrectionRef.current = true;
    correct();
    isApplyingCorrectionRef.current = false;
  };

  const calculationItemById = useMemo(
    () => new Map((calculation?.items ?? []).map((item) => [item.id, item])),
    [calculation],
  );

  useEffect(() => {
    if (!isDefined(calculation)) {
      return;
    }

    pickedItems.forEach((pickedItem, index) => {
      const calculationItem = calculationItemById.get(index);

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
    // Reconciliation must run only when a new calculation result arrives, reading the
    // current form state fresh each time - re-running it for every keystroke that
    // changes `pickedItems`/`form` identity would fight the user's own edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculation]);

  const displayByVariantId = useMemo(() => getDisplayByVariantId(selections), [selections]);

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
      const response = await createMutation.mutateAsync(payload);

      if (isDefined(response.data) && isDefined(response.data.id)) {
        void navigate(RouteConfig.Orders.get('OrderDetail').buildLink({ id: response.data.id }), {
          replace: true,
        });
      }
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  });

  const value: OrderCreateContextValue = {
    form,
    pickerOpen,
    setPickerOpen,
    selections,
    rows,
    calculation,
    calculationItemById,
    isCalculating,
    isCreating: createMutation.isPending,
    rejectedCouponCodes,
    handleAddItems,
    handleQuantityChange,
    handleRemoveItem,
    handleSubmit,
  };

  return <OrderCreateContext.Provider value={value}>{children}</OrderCreateContext.Provider>;
};

OrderCreateProvider.displayName = 'OrderCreateProvider';

export { OrderCreateContext, OrderCreateProvider };
