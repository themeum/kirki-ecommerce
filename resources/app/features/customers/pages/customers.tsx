import { useNavigate } from 'react-router';

import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import CustomerTable from '@/features/customers/components/customer-table/customer-table';
import { CustomerInfoIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import { flexCenter, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const Customers = () => {
  const navigate = useNavigate();

  const handleAddNewCustomer = () => {
    void navigate(RouteConfig.Customers.get('CustomerDetail').buildLink({ id: NEW_ITEM_ID }));
  };

  return (
    <>
      <PageHeading
        text={__('Customers', 'kirki-ecommerce')}
        actions={
          <Button
            variant="primary"
            onClick={handleAddNewCustomer}
          >
            {__('Add Customer', 'kirki-ecommerce')}
          </Button>
        }
      />

      <Container>
        <Flex direction="column" gap={2}>
          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <Flex gap={3}>
                <span css={styles.svgClass}>
                  <CustomerInfoIcon />
                </span>
                <Flex direction="column" gap={2}>
                  <Text weight="medium">{__('Create Groups with Customers', 'kirki-ecommerce')}</Text>
                  <Text variant="small" color="secondary">{__(
                    'Organize customers for better targeting and management',
                    'kirki-ecommerce',
                  )}</Text>
                </Flex>
                <ActionGroup>
                  <Badge>{__('Coming Soon', 'kirki-ecommerce')}</Badge>
                  {/* TODO: implement group management later */}
                  {/* <Button
                    variant="ghost"
                    onClick={() => navigate(RouteConfig.Customers.get('CustomerGroups').buildLink())}
                  >
                    {__('Manage Group', 'kirki-ecommerce')}
                  </Button>
                  <Button variant="secondary">
                    {__('Create Group', 'kirki-ecommerce')}
                  </Button> */}
                </ActionGroup>
              </Flex>
            </CardContent>
          </Card>
          <CustomerTable />
        </Flex>
      </Container>
    </>
  );
};

Customers.displayName = 'Customers';

export default Customers;

const styles = {
  svgClass: scoped(flexCenter()),
};
