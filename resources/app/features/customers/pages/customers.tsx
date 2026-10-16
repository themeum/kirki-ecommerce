import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import CustomerTable from '@/features/customers/components/customer-table/customer-table';
import { useCustomersQuery } from '@/features/customers/services/customer';
import { customerListOptions } from '@/features/customers/types';
import { useDataTableParams } from '@/hooks';
import { CustomerEmptyStateIcon } from '@/icons/empty-state';
import { __ } from '@/wpi18n';

const Customers = () => {
  const navigate = useNavigate();
  const { params, hasActiveFilters } = useDataTableParams(customerListOptions);

  const { data, isFetching, isError, refetch } = useCustomersQuery(params);

  const hasRecord = !(!isFetching && !hasActiveFilters && data?.total === 0); // @todo: later will use isDefined(data) && isDefined(data.has_record) && data?.has_record

  const handleAddNewCustomer = () => {
    void navigate(RouteConfig.Customers.get('CustomerDetail').buildLink({ id: NEW_ITEM_ID }));
  };

  return (
    <Page>
      <PageHeading
        text={__('Customers', 'kirki-ecommerce')}
        actions={
          hasRecord && (
            <Button variant="primary" onClick={handleAddNewCustomer}>
              {__('Add Customer', 'kirki-ecommerce')}
            </Button>
          )
        }
      />

      <PageContent>
        <Flex direction="column" gap={2}>
          {/* TODO: implement group management later */}
          {/* <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <Flex gap={3}>
                <span css={styles.svgClass}>
                  <CustomerInfoIcon />
                </span>
                <Flex direction="column" gap={2}>
                  <Text weight="medium">
                    {__('Create Groups with Customers', 'kirki-ecommerce')}
                  </Text>
                  <Text variant="small" color="secondary">
                    {__(
                      'Organize customers for better targeting and management',
                      'kirki-ecommerce',
                    )}
                  </Text>
                </Flex>
                <ActionGroup>
                  <Badge>{__('Coming Soon', 'kirki-ecommerce')}</Badge>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      navigate(RouteConfig.Customers.get('CustomerGroups').buildLink())
                    }
                  >
                    {__('Manage Group', 'kirki-ecommerce')}
                  </Button>
                  <Button variant="secondary">{__('Create Group', 'kirki-ecommerce')}</Button>
                </ActionGroup>
              </Flex>
            </CardContent>
          </Card> */}
          {isError ? (
          <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : !hasRecord ? (
            <NotFoundState
              icon={<CustomerEmptyStateIcon />}
              text={__('Waiting on customer #1', 'kirki-ecommerce')}
              description={__(
                'Your first fan is just an order away. Once customers sign up or make a purchase, their details will live right here.',
                'kirki-ecommerce',
              )}
              actions={
                <Button variant="primary" onClick={handleAddNewCustomer}>
                  {__('Add Customer', 'kirki-ecommerce')}
                </Button>
              }
            />
          ) : (
            <CustomerTable data={data} isLoading={isFetching} />
          )}
        </Flex>
      </PageContent>
    </Page>
  );
};

Customers.displayName = 'Customers';

export default Customers;
