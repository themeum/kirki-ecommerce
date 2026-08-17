import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import CollectionTable from '@/features/collections/components/collection-table/collection-table';
import { __ } from '@/wpi18n';

const Collections = () => {
  const navigate = useNavigate();

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
        <CollectionTable />
      </Container>
    </>
  );
};

Collections.displayName = 'Collections';

export default Collections;

