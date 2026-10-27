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
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const Products = () => {
  const navigate = useNavigate();
  const { params } = useDataTableParams(productListOptions);

  const { data, isFetching, isError, refetch, isFetched } = useProductsQuery(params);

  const showNoRecordState =
    isFetched && isDefined(data) && isDefined(data.has_records) && !data.has_records;

  return (
    <Page>
      <PageHeading
        text={__('Products', 'kirki-ecommerce')}
        actions={
          !isFetching &&
          !showNoRecordState && (
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
        ) : showNoRecordState ? (
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
