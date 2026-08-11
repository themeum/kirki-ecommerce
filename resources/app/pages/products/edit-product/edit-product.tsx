import { useParams } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { mapProductToFormValues, type ProductFormPayload } from '@/schemas/forms/product-form';
import {
  useProductQuery,
  useUpdateProductMutation,
} from '@/services/product';
import { __ } from '@/wpi18n';

import ProductForm from '@/pages/products/product-form/product-form';

const EditProduct = () => {
  const { id } = useParams();
  const {
    data: product,
    isLoading,
    isError,
  } = useProductQuery(id as string, Boolean(id));
  const updateProductMutation = useUpdateProductMutation();

  if (isLoading) {
    return <LoadingSpinner />;
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
