import LoadingSpinner from '@/components/loading-spinner';
import { RouteConfig } from '@/config/route-config';
import { getDefaults } from '@/libs/zod';
import {
  getDefaultVariantValues,
  mapProductToFormValues,
  ProductFormSchema,
  type ProductFormInput,
  type ProductFormPayload,
} from '@/schemas/forms/product-form';
import {
  useCreateProductMutation,
} from '@/services/product';
import { useDefaultSettingsQuery, useSettingsQuery } from '@/services/settings';
import { useShippingBoxesQuery } from '@/services/shipping';
import { isDefined } from '@/utils/object';
import { useNavigate } from 'react-router';

import ProductForm from '@/pages/products/product-form/product-form';

const CreateProduct = () => {
  const navigate = useNavigate();
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
    return <LoadingSpinner />;
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
      navigate(RouteConfig.Products.get('EditProduct').buildLink({ id: response.data.id }));
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
