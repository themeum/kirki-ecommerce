import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import BrandTable from '@/features/brands/components/brand-table/brand-table';
import NewBrandButton from '@/features/brands/components/new-brand-button';
import { useBrandsQuery } from '@/features/brands/services/brand';
import { brandListOptions } from '@/features/brands/types';
import { useDataTableParams } from '@/hooks';
import { BrandEmptyStateIcon } from '@/icons/empty-state';
import { __ } from '@/wpi18n';

const Brands = () => {
  const { params, hasActiveFilters } = useDataTableParams(brandListOptions);

  const { data, isFetching, isError, refetch } = useBrandsQuery(params);

  const hasRecord = !(!isFetching && !hasActiveFilters && data?.total === 0); // @todo: later will use isDefined(data) && isDefined(data.has_record) && data?.has_record

  return (
    <Page>
      <PageHeading
        text={__('Brands', 'kirki-ecommerce')}
        actions={hasRecord && <NewBrandButton />}
      />
      <PageContent>
        {isError ? (
          <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : !hasRecord ? (
          <NotFoundState
            icon={<BrandEmptyStateIcon />}
            text={__('Add your brands', 'kirki-ecommerce')}
            description={__(
              'Brands let customers shop by maker and filter results.',
              'kirki-ecommerce',
            )}
            actions={<NewBrandButton label={__('Add brand', 'kirki-ecommerce')} />}
          />
        ) : (
          <BrandTable data={data} isLoading={isFetching} />
        )}
      </PageContent>
    </Page>
  );
};

Brands.displayName = 'Brands';

export default Brands;
