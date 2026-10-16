import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import { RouteConfig } from '@/config/route-config';
import { productListOptions } from '@/features/products';
import ProductTable from '@/features/products/components/product-table/product-table';
import { useProductsQuery } from '@/features/products/services/product';
import { useDataTableParams } from '@/hooks';
import { ProductEmptyStateIcon } from '@/icons/empty-state';
import { __ } from '@/wpi18n';

const Products = () => {
  const navigate = useNavigate();
  const { params, hasActiveFilters } = useDataTableParams(productListOptions);

  const { data, isFetching, isError, refetch } = useProductsQuery(params);

  const hasRecord = !(!isFetching && !hasActiveFilters && data?.total === 0); // @todo: later will use isDefined(data) && isDefined(data.has_record) && data?.has_record

  return (
    <Page>
      <PageHeading
        text={__('Products', 'kirki-ecommerce')}
        actions={
          hasRecord && (
            <Button
              variant="primary"
              onClick={() => {
                void navigate(RouteConfig.Products.get('CreateProduct').buildLink());
              }}
            >
              {__('Add Product', 'kirki-ecommerce')}
            </Button>
          )
        }
      />
      <PageContent>
        {isError ? (
          <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : !hasRecord ? (
          <NotFoundState
            icon={<ProductEmptyStateIcon />}
            text={__('Add a product', 'kirki-ecommerce')}
            description={__(
              'Every great business begins with product number one.',
              'kirki-ecommerce',
            )}
            actions={
              <Button
                variant="primary"
                onClick={() => {
                  void navigate(RouteConfig.Products.get('CreateProduct').buildLink());
                }}
              >
                {__('Add Product', 'kirki-ecommerce')}
              </Button>
            }
          />
        ) : (
          <ProductTable data={data} isLoading={isFetching} />
        )}
      </PageContent>
    </Page>
  );
};

Products.displayName = 'Products';

export default Products;
