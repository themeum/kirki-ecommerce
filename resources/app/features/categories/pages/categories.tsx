import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import CategoryTable from '@/features/categories/components/category-table/category-table';
import NewCategoryButton from '@/features/categories/components/new-category-button';
import { useCategoriesQuery } from '@/features/categories/services/category';
import { categoryListOptions } from '@/features/categories/types';
import { useDataTableParams } from '@/hooks';
import { CategoryEmptyStateIcon } from '@/icons/empty-state';
import { __ } from '@/wpi18n';

const Categories = () => {
  const { params, hasActiveFilters } = useDataTableParams(categoryListOptions);

  const { data, isFetching, isError, refetch } = useCategoriesQuery(params);

  const hasRecord = !(!isFetching && !hasActiveFilters && data?.total === 0); // @todo: later will use isDefined(data) && isDefined(data.has_record) && data?.has_record

  return (
    <Page>
      <PageHeading
        text={__('Categories', 'kirki-ecommerce')}
        actions={hasRecord && <NewCategoryButton />}
      />
      <PageContent>
        {isError ? (
          <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : !hasRecord ? (
          <NotFoundState
            icon={<CategoryEmptyStateIcon />}
            text={__('Organize products into categories', 'kirki-ecommerce')}
            description={__(
              'Help customers find what they need by grouping similar products.',
              'kirki-ecommerce',
            )}
            actions={<NewCategoryButton label={__('Create Category', 'kirki-ecommerce')} />}
          />
        ) : (
          <CategoryTable data={data} isLoading={isFetching} />
        )}
      </PageContent>
    </Page>
  );
};

Categories.displayName = 'Categories';

export default Categories;
