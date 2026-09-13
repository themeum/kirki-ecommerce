import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import { RouteConfig } from '@/config/route-config';
import ProductTable from '@/features/products/components/product-table/product-table';
import { __ } from '@/wpi18n';

const Products = () => {
  const navigate = useNavigate();

  return (
    <Page>
      <PageHeading
        text={__('Products', 'kirki-ecommerce')}
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
      <PageContent>
        <ProductTable />
      </PageContent>
    </Page>
  );
};

Products.displayName = 'Products';

export default Products;
