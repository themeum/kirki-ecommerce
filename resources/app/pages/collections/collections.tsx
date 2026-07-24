import { useNavigate } from 'react-router';

import Pagination from '@/components/pagination';
import Button from '@/components/ui/button';
import { NEW_ITEM_ID } from '@/conf';
import { useListParams } from '@/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { cardStyles } from '@/theme/card-styles';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
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
            variant="primary"
            onClick={() => {
              navigate('/collections/' + NEW_ITEM_ID);
            }}
          >
            {__('Add Collection', 'kirki-ecommerce')}
          </Button>
        }
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card css={cardStyles.tableCard}>
              <CardContent css={cardStyles.tableContent}>
                <CollectionTable data={data!} isFetching={isFetching} />
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

Collections.displayName = 'Collections';

export default Collections;

