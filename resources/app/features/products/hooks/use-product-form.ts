import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { useUnsavedNavigationGuard } from '@/features/products/components/product-form/use-unsaved-navigation-guard';
import { resolveSaveFailure, resolveSaveSuccess, type SaveResult } from '@/features/products/lib/save-result';
import { shouldShowSimpleVariantSections } from '@/features/products/lib/variant-sections';
import {
  getDefaultVariantValues,
  type ProductFormInput,
  type ProductFormPayload,
  ProductFormSchema,
} from '@/features/products/schemas/forms/product-form';
import type { ErrorResponse } from '@/libs/api';
import { setUnsavedDataStatus } from '@/libs/unsaved-store';
import { getDefaults } from '@/libs/zod';

type UseProductFormOptions = {
  initialValues?: ProductFormInput;
  onSubmit: (data: ProductFormPayload) => Promise<ProductFormInput | void>;
};

type HandleSaveOptions = {
  focusOnError?: boolean;
};

type UseProductFormResult = {
  form: UseFormReturn<ProductFormInput, unknown, ProductFormPayload>;
  showSimpleVariantSections: boolean;
  isDirty: boolean;
  isBlocked: boolean;
  discardChanges: () => void;
  shakeSignal: number;
  handleSave: (options?: HandleSaveOptions) => Promise<SaveResult>;
};

export const useProductForm = ({
  initialValues,
  onSubmit,
}: UseProductFormOptions): UseProductFormResult => {
  const form = useForm<ProductFormInput, unknown, ProductFormPayload>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues:
      initialValues ?? {
        ...getDefaults(ProductFormSchema),
        variants: [getDefaultVariantValues()],
      },
  });

  const hasVariants = useWatch({ control: form.control, name: 'has_variants' });
  const attributeValues = useWatch({
    control: form.control,
    name: 'variants.0.attribute_values',
  });

  const showSimpleVariantSections = shouldShowSimpleVariantSections(
    hasVariants,
    attributeValues,
  );

  const { isDirty } = form.formState;

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
    return () => setUnsavedDataStatus(false);
  }, [isDirty]);

  const { isBlocked, discardChanges, markSaving, shakeSignal } =
    useUnsavedNavigationGuard(isDirty);

  const handleSave = async ({
    focusOnError = true,
  }: HandleSaveOptions = {}): Promise<SaveResult> => {
    let result: SaveResult = { success: false };

    markSaving(true);
    try {
      await form.handleSubmit(async (payload) => {
        try {
          const resetValues = await onSubmit(payload);
          if (resetValues) {
            form.reset(resetValues);
          }
          result = resolveSaveSuccess();
        } catch (error) {
          const failure = resolveSaveFailure(form, error as ErrorResponse, { focusOnError });
          toast.error(failure.toastMessage);
          result = failure;
        }
      })();
    } finally {
      markSaving(false);
    }

    return result;
  };

  return {
    form,
    showSimpleVariantSections,
    isDirty,
    isBlocked,
    discardChanges,
    shakeSignal,
    handleSave,
  };
};
