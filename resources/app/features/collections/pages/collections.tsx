import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import CollectionTable from '@/features/collections/components/collection-table/collection-table';
import { useCollectionsQuery } from '@/features/collections/services/collection';
import { collectionListOptions } from '@/features/collections/types';
import { useDataTableParams } from '@/hooks';
import { CollectionEmptyStateIcon } from '@/icons/empty-state';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const Collections = () => {
  const navigate = useNavigate();

  const { params } = useDataTableParams(collectionListOptions);

  const { data, isFetching, isError, refetch, isFetched } = useCollectionsQuery(params);

  const showNoRecordState =
    isFetched && isDefined(data) && isDefined(data.has_records) && !data.has_records;

  return (
    <Page>
      <PageHeading
        text={__('Collections', 'kirki-ecommerce')}
        actions={
          !isFetching &&
          !showNoRecordState && (
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
          )
        }
      />
      <PageContent>
        {isError ? (
          <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : showNoRecordState ? (
          <NotFoundState
            icon={<CollectionEmptyStateIcon />}
            text={__('Group products into collections', 'kirki-ecommerce')}
            description={__(
              'Curate seasonal drops and featured items to create a memorable shopping experience.',
              'kirki-ecommerce',
            )}
            actions={
              <Button
                variant="primary"
                onClick={() => {
                  void navigate(
                    RouteConfig.Collections.get('CollectionDetail').buildLink({
                      id: NEW_ITEM_ID,
                    }),
                  );
                }}
              >
                {__('Create Collection', 'kirki-ecommerce')}
              </Button>
            }
          />
        ) : (
          <CollectionTable data={data} isLoading={isFetching} />
        )}
      </PageContent>
    </Page>
  );
};

Collections.displayName = 'Collections';

export default Collections;
