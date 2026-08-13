import { useNavigate } from 'react-router';

import Pagination from '@/components/pagination';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import CollectionTable from '@/features/collections/components/collection-table/collection-table';
import { useCollectionsQuery } from '@/features/collections/services/collection';
import { useListParams } from '@/hooks';
import { cardStyles } from '@/theme/card-styles';
import type { PaginationData } from '@/types/components/common';
import { __ } from '@/wpi18n';

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
              void navigate(
                RouteConfig.Collections.get('CollectionDetail').buildLink({ id: NEW_ITEM_ID }),
              );
            }}
          >
            {__('Add Collection', 'kirki-ecommerce')}
          </Button>
        }
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={4}>
            <Card cssOverride={cardStyles.tableCard}>
              <CardContent cssOverride={cardStyles.tableContent}>
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

