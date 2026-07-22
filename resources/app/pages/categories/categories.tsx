import { Card } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Pagination from '@/components/pagination';
import { useListParams } from '@/hooks';
import { useCategoriesQuery } from '@/services/category';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import CategoryTable from '@/pages/categories/category-table/category-table';
import NewCategory from '@/pages/categories/new-category';

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
          <Flex direction="column" gap={16}>
            <Card type="table">
              <CategoryTable data={data!} isFetching={isFetching} />
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
