import { useNavigate, useParams } from 'react-router';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import ProductForm from '@/features/products/components/product-form/product-form';
import { mapProductToFormValues, type ProductFormPayload } from '@/features/products/schemas/forms/product-form';
import {
  useDuplicateProductMutation,
  useProductQuery,
  useUpdateProductMutation,
} from '@/features/products/services/product';
import ProductFormSkeleton from '@/features/products/skeletons/product-form-skeleton';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: product,
    isLoading,
    isError,
  } = useProductQuery(id!, Boolean(id));
  const updateProductMutation = useUpdateProductMutation();
  const duplicateProductMutation = useDuplicateProductMutation();

  if (isLoading) {
    return <ProductFormSkeleton />;
  }

  if (isError || !product) {
    return (
      <Flex justify="center" align="center" cssOverride={{ minHeight: 200 }}>
        <Text color="secondary">
          {__('Product could not be loaded.', 'kirki-ecommerce')}
        </Text>
      </Flex>
    );
  }

  const handleSubmit = async (data: ProductFormPayload) => {
    const response = await updateProductMutation.mutateAsync({
      id: Number(id),
      data,
    });
    return mapProductToFormValues(response.data);
  };

  const handleDuplicate = async () => {
    const response = await duplicateProductMutation.mutateAsync(Number(id));
    if (isDefined(response.data.id)) {
      void navigate(RouteConfig.Products.get('EditProduct').buildLink({ id: response.data.id }));
    }
  };

  return (
    <ProductForm
      key={product.id}
      mode="edit"
      product={product}
      initialValues={mapProductToFormValues(product)}
      onSubmit={handleSubmit}
      isSubmitting={updateProductMutation.isPending}
      onDuplicate={handleDuplicate}
      isDuplicating={duplicateProductMutation.isPending}
    />
  );
};

EditProduct.displayName = 'EditProduct';

export default EditProduct;
