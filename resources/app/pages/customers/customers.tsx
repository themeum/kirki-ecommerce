import { useNavigate } from 'react-router';

import Pagination from '@/components/pagination';
import Button from '@/components/ui/button';
import { CLASS_PREFIX, NEW_ITEM_ID } from '@/conf';
import { useListParams } from '@/hooks';
import { CustomerInfoIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import { Card } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import { useCustomersQuery } from '@/services/customer';
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
            size="sm"
            onClick={handleAddNewCustomer}
          >
            {__('Add Customer', 'kirki-ecommerce')}
          </Button>
        }
      />

      <Container>
        {loaded ? (
          <Flex direction="column" gap={8}>
            <Card type="form">
              <Flex gap={12}>
                <span className={`${CLASS_PREFIX}-svg-class`}>
                  <CustomerInfoIcon />
                </span>
                <Text
                  type="secondary"
                  header={__('Create Groups with Customers', 'kirki-ecommerce')}
                  subHeader={__(
                    'Organize customers for better targeting and management',
                    'kirki-ecommerce',
                  )}
                />
                <ActionGroup>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGroupManage}
                  >
                    {__('Manage Group', 'kirki-ecommerce')}
                  </Button>
                  <Button variant="secondary" size="sm">
                    {__('Create Group', 'kirki-ecommerce')}
                  </Button>
                </ActionGroup>
              </Flex>
            </Card>
            <Card type="table">
              <CustomerTable data={data!} isFetching={isFetching} />
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
