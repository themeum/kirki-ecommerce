import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormReturn } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { useGenerateSkuMutation } from '@/features/inventory';
import { resolveSaveFailure, resolveSaveSuccess, type SaveResult } from '@/features/products/lib/save-result';
import { shouldShowSimpleVariantSections } from '@/features/products/lib/variant-sections';
import {
  getDefaultVariantValues,
  type ProductFormInput,
  type ProductFormPayload,
  ProductFormSchema,
} from '@/features/products/schemas/forms/product-form';
import { useUnsavedNavigationGuard } from '@/hooks/use-unsaved-navigation-guard';
import type { ErrorResponse } from '@/libs/api';
import { getDefaults } from '@/libs/zod';

type UseProductFormOptions = {
  initialValues?: ProductFormInput | null;
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
  generateSku: () => void;
  isGeneratingSku: boolean;
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

  const generateSkuMutation = useGenerateSkuMutation();

  const generateSku = () => {
    const values = form.getValues();

    generateSkuMutation.mutate(
      {
        title: values.title,
        brand_id: values.brand?.id ?? null,
        category_ids: values.categories?.map((category) => category.id) ?? [],
        attribute_value_ids: values.variants?.[0]?.attribute_values ?? [],
      },
      {
        onSuccess: (response) => {
          form.setValue('variants.0.sku', response.data.sku, {
            shouldDirty: true,
            shouldTouch: true,
          });
        },
      },
    );
  };

  const { isDirty } = form.formState;

  const { isBlocked, cancelNavigation, markSaving, shakeSignal } =
    useUnsavedNavigationGuard(isDirty);

  // Discarding reverts the form and stays put; any navigation that was blocked
  // is abandoned rather than completed, so the merchant keeps the page they
  // are looking at.
  const discardChanges = () => {
    form.reset();
    cancelNavigation();
  };

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
    generateSku,
    isGeneratingSku: generateSkuMutation.isPending,
  };
};
