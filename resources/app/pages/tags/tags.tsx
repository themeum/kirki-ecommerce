import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import Pagination from '@/components/pagination';
import { useListParams } from '@/hooks';
import { useTagsQuery } from '@/services/tag';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import TagTable from '@/pages/tags/tag-table/tag-table';
import NewTag from '@/pages/tags/new-tag';

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
          <Flex direction="column" gap={16}>
            <Card type="table">
              <TagTable data={data!} isFetching={isFetching} />
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
