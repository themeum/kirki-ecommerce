import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import BrandTable from '@/features/brands/components/brand-table/brand-table';
import NewBrandButton from '@/features/brands/components/new-brand-button';
import { useBrandsQuery } from '@/features/brands/services/brand';
import { brandListOptions } from '@/features/brands/types';
import { useDataTableParams } from '@/hooks';
import { BrandEmptyStateIcon } from '@/icons/empty-state';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const Brands = () => {
  const { params } = useDataTableParams(brandListOptions);

  const { data, isFetching, isError, refetch, isFetched } = useBrandsQuery(params);

  const showNoRecordState =
    isFetched && isDefined(data) && isDefined(data.has_records) && !data.has_records;

  return (
    <Page>
      <PageHeading
        text={__('Brands', 'kirki-ecommerce')}
        actions={!isFetching && !showNoRecordState && <NewBrandButton />}
      />
      <PageContent>
        {isError ? (
          <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : showNoRecordState ? (
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
