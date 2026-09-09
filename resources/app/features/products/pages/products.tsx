import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import { RouteConfig } from '@/config/route-config';
import ProductTable from '@/features/products/components/product-table/product-table';
import { __ } from '@/wpi18n';

const Products = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeading
        text={__('Products', 'kirki-ecommerce')}
        sticky
        actions={
          <>
            <Button
              variant="primary"
              onClick={() => {
                void navigate(RouteConfig.Products.get('CreateProduct').buildLink());
              }}
            >
              {__('Add Product', 'kirki-ecommerce')}
            </Button>
          </>
        }
      />
      <Container>
        <ProductTable />
      </Container>
    </>
  );
};

Products.displayName = 'Products';

export default Products;
