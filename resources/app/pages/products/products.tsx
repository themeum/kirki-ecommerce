import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import { RouteConfig } from '@/config/route-config';
import { __ } from '@/wpi18n';

import ProductTable from '@/pages/products/product-table/product-table';

const Products = () => {
  const navigate = useNavigate();

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
                navigate(RouteConfig.Products.get('CreateProduct').buildLink());
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
