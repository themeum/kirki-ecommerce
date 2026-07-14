import { useNavigate } from 'react-router';

import Pagination from '@/components/pagination';
import { NEW_ITEM_ID } from '@/conf';
import { useListParams } from '@/hooks';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { useCollectionsQuery } from '@/services/collection';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import CollectionTable from '@/pages/collections/collection-table/collection-table';

const Collections = () => {
  const navigate = useNavigate();
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'title',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const { data, isLoading, isFetching } = useCollectionsQuery(params);

  const handlePaginationChange = (value: number) => {
    setParam('page', value);
  };

  const loaded = !isLoading && Boolean(data);

  return (
    <>
      <PageHeading
        text={__('Collections', 'kirki-ecommerce')}
        actions={
          <Button
            type="primary"
            size="small"
            text={__('Add Collection', 'kirki-ecommerce')}
            onClick={() => {
              navigate('/collections/' + NEW_ITEM_ID);
            }}
          />
        }
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <CollectionTable data={data!} isFetching={isFetching} />
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

Collections.displayName = 'Collections';

export default Collections;
