import { RouteConfig } from '@/config/route-config';
import ProductForm from '@/features/products/components/product-form/product-form';
import {
  getDefaultVariantValues,
  mapProductToFormValues,
  type ProductFormInput,
  type ProductFormPayload,
  ProductFormSchema,
} from '@/features/products/schemas/forms/product-form';
import {
  useCreateProductMutation,
} from '@/features/products/services/product';
import ProductFormSkeleton from '@/features/products/skeletons/product-form-skeleton';
import { useShippingBoxesQuery } from '@/features/settings';
import { useRedirect } from '@/hooks';
import { getDefaults } from '@/libs/zod';
import { useDefaultSettingsQuery, useSettingsQuery } from '@/services/settings';
import { isDefined } from '@/utils/object';

const CreateProduct = () => {
  const redirect = useRedirect();
  const { data: defaultSettings, isLoading: isLoadingDefaults } =
    useDefaultSettingsQuery();
  const { data: productSettings, isLoading: isLoadingSettings } =
    useSettingsQuery('product');
  const { data: shippingBoxes, isLoading: isLoadingBoxes } =
    useShippingBoxesQuery({ limit: -1 });
  const createProductMutation = useCreateProductMutation();

  const isLoading =
    isLoadingDefaults || isLoadingSettings || isLoadingBoxes;

  if (isLoading) {
    return <ProductFormSkeleton />;
  }

  const defaults = getDefaults(ProductFormSchema);
  const defaultBox = (shippingBoxes ?? []).find((item) => Boolean(item.is_default));

  const seededValues: ProductFormInput = {
    ...defaults,
    currency: defaultSettings?.base_currency ?? null,
    variants: [
      {
        ...getDefaultVariantValues(),
        weight_unit: productSettings?.weight_unit ?? null,
        show_unit_price: productSettings?.is_unit_price_visible ?? false,
        dimension_unit: productSettings?.dimension_unit ?? null,
        shipping_box_id: defaultBox?.id ?? null,
      },
    ],
  };

  const handleSubmit = async (data: ProductFormPayload) => {
    const response = await createProductMutation.mutateAsync(data);
    if (isDefined(response.data.id)) {
      redirect(RouteConfig.Products.get('EditProduct'), { id: response.data.id }, true);
    }
    return mapProductToFormValues(response.data);
  };

  return (
    <ProductForm
      mode="create"
      initialValues={seededValues}
      onSubmit={handleSubmit}
      isSubmitting={createProductMutation.isPending}
    />
  );
};

CreateProduct.displayName = 'CreateProduct';

export default CreateProduct;
