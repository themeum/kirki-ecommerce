import { useNavigate } from 'react-router';

import Pagination from '@/components/pagination';
import Button from '@/components/ui/button';
import { NEW_ITEM_ID } from '@/conf';
import { useListParams } from '@/hooks';
import { CustomerInfoIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import { useCustomersQuery } from '@/services/customer';
import { flexCenter, scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import CustomerTable from '@/pages/customers/customer-table/customer-table';

const Customers = () => {
  const navigate = useNavigate();
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'first_name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const { data, isLoading, isFetching } = useCustomersQuery(params);

  const handleGroupManage = () => {
    navigate('/customers/groups');
  };

  const handleAddNewCustomer = () => {
    navigate('/customers/' + NEW_ITEM_ID);
  };

  const handlePaginationChange = (value: number) => {
    setParam('page', value);
  };

  const loaded = !isLoading && Boolean(data);

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
        {loaded ? (
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
                    <Button
                      variant="ghost"
                      onClick={handleGroupManage}
                    >
                      {__('Manage Group', 'kirki-ecommerce')}
                    </Button>
                    <Button variant="secondary">
                      {__('Create Group', 'kirki-ecommerce')}
                    </Button>
                  </ActionGroup>
                </Flex>
              </CardContent>
            </Card>
            <Card cssOverride={cardStyles.tableCard}>
              <CardContent cssOverride={cardStyles.tableContent}>
                <CustomerTable data={data!} isFetching={isFetching} />
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

Customers.displayName = 'Customers';

export default Customers;

const styles = {
  svgClass: scoped(flexCenter())
};
