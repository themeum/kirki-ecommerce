import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import { useListParams } from '@/hooks';
import { useProductsQuery } from '@/services/product';
import { __ } from '@/wpi18n';

import ProductTable from '@/pages/products/product-table/product-table';
import { ProductListFilter, productListOptions } from '@/types/filters/product';

const Products = () => {
  const navigate = useNavigate();
  const { params, setParam } =
    useListParams<ProductListFilter>(productListOptions);
  const { data, isLoading } = useProductsQuery(params);

  const handlePaginationChange = useCallback(
    (value: number) => {
      setParam('page', value);
    },
    [setParam],
  );

  return (
    <>
      <PageHeading
        text={__('Products', 'kirki-ecommerce')}
        actions={
          <>
            <Button variant="ghost">
              {__('Import', 'kirki-ecommerce')}
            </Button>
            <Button variant="ghost">
              {__('Export', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                navigate('/products/create');
              }}
            >
              {__('Add Product', 'kirki-ecommerce')}
            </Button>
          </>
        }
      />
      <Container>
        <ProductTable
          data={data}
          isLoading={isLoading}
          onPageChange={handlePaginationChange}
        />
      </Container>
    </>
  );
};

Products.displayName = 'Products';

export default Products;
