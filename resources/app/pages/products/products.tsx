import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import { RouteConfig } from '@/config/route-config';
import ProductTable from '@/pages/products/product-table/product-table';
import { __ } from '@/wpi18n';

const Products = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeading
        text={__('Products', 'kirki-ecommerce')}
        actions={
          <>
            <Button variant="ghost" disabled>
              {__('Import', 'kirki-ecommerce')}
            </Button>
            <Button variant="ghost" disabled>
              {__('Export', 'kirki-ecommerce')}
            </Button>
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
