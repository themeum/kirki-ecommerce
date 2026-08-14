import { useParams } from 'react-router';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ProductForm from '@/features/products/components/product-form/product-form';
import { mapProductToFormValues, type ProductFormPayload } from '@/features/products/schemas/forms/product-form';
import {
  useProductQuery,
  useUpdateProductMutation,
} from '@/features/products/services/product';
import ProductFormSkeleton from '@/features/products/skeletons/product-form-skeleton';
import { __ } from '@/wpi18n';

const EditProduct = () => {
  const { id } = useParams();
  const {
    data: product,
    isLoading,
    isError,
  } = useProductQuery(id!, Boolean(id));
  const updateProductMutation = useUpdateProductMutation();
  let x = true;

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

  return (
    <ProductForm
      key={product.id}
      mode="edit"
      initialValues={mapProductToFormValues(product)}
      onSubmit={handleSubmit}
      isSubmitting={updateProductMutation.isPending}
    />
  );
};

EditProduct.displayName = 'EditProduct';

export default EditProduct;
