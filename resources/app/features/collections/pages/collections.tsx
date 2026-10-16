import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import CollectionTable from '@/features/collections/components/collection-table/collection-table';
import { useCollectionsQuery } from '@/features/collections/services/collection';
import { collectionListOptions } from '@/features/collections/types';
import { useDataTableParams } from '@/hooks';
import { CollectionEmptyStateIcon } from '@/icons/empty-state';
import { __ } from '@/wpi18n';

const Collections = () => {
  const navigate = useNavigate();

  const { params } = useDataTableParams(collectionListOptions);

  const { data, isFetching } = useCollectionsQuery(params);

  const hasRecord = data?.has_records !== false;

  return (
    <Page>
      <PageHeading
        text={__('Collections', 'kirki-ecommerce')}
        actions={
          hasRecord && (
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
        {!hasRecord ? (
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
