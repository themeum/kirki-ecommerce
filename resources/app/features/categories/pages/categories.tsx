import Pagination from '@/components/pagination';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import CategoryTable from '@/features/categories/components/category-table/category-table';
import NewCategory from '@/features/categories/components/new-category';
import { useCategoriesQuery } from '@/features/categories/services/category';
import { useListParams } from '@/hooks/index';
import { cardStyles } from '@/theme/card-styles';
import type { PaginationData } from '@/types/components/common';
import { __ } from '@/wpi18n';

const Categories = () => {
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const { data, isLoading, isFetching } = useCategoriesQuery(params);

  const handlePaginationChange = (value: number) => {
    setParam('page', value);
  };

  const loaded = !isLoading && Boolean(data);

  return (
    <>
      <PageHeading
        text={__('Categories', 'kirki-ecommerce')}
        actions={<NewCategory />}
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={4}>
            <Card cssOverride={cardStyles.tableCard}>
              <CardContent cssOverride={cardStyles.tableContent}>
                <CategoryTable data={data!} isFetching={isFetching} />
              </CardContent>
            </Card>
            <Pagination
              data={data as PaginationData}
              onChange={(page) => handlePaginationChange(page)}
            />
          </Flex>
        ) : (
          <div>{__('Loading...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

Categories.displayName = 'Categories';

export default Categories;

