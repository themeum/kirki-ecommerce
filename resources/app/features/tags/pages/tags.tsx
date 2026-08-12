import Pagination from '@/components/pagination';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import NewTag from '@/features/tags/components/new-tag';
import TagTable from '@/features/tags/components/tag-table/tag-table';
import { useTagsQuery } from '@/features/tags/services/tag';
import { useListParams } from '@/hooks/index';
import { cardStyles } from '@/theme/card-styles';
import type { PaginationData } from '@/types/components/common';
import { __ } from '@/wpi18n';

const Tags = () => {
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const { data, isLoading, isFetching } = useTagsQuery(params);

  const handlePaginationChange = (value: number) => {
    setParam('page', value);
  };

  const loaded = !isLoading && Boolean(data);

  return (
    <>
      <PageHeading text={__('Tags', 'kirki-ecommerce')} actions={<NewTag />} />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={4}>
            <Card cssOverride={cardStyles.tableCard}>
              <CardContent cssOverride={cardStyles.tableContent}>
                <TagTable data={data!} isFetching={isFetching} />
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

Tags.displayName = 'Tags';

export default Tags;

