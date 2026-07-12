import { useNavigate } from 'react-router';

import Pagination from '@/components/pagination';
import { CLASS_PREFIX, NEW_ITEM_ID } from '@/conf';
import { useGetListAPI } from '@/hooks';
import { CustomerInfoIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import Text from '@/molecules/text';
import { getCustomersAPI, setKeyValue } from '@/store/customersSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import CustomerTable from '@/pages/customers/customer-table/customer-table';

const Customers = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loaded, data } = useAppSelector((state) => state.customers);
  useGetListAPI({ reducerName: 'customers', apiCallBack: getCustomersAPI });
  const handleGroupManage = () => {
    navigate('/customers/groups');
  };
  const handleAddNewCustomer = () => {
    navigate('/customers/' + NEW_ITEM_ID);
  };
  const handlePaginationChange = (value: number) => {
    dispatch(setKeyValue({ key: 'page', value: value }));
  };
  return (
    <>
      <PageHeading
        text={__('Customers', 'kirki-ecommerce')}
        actions={
          <Button
            type="primary"
            text={__('Add Customer', 'kirki-ecommerce')}
            size="small"
            onClick={handleAddNewCustomer}
          />
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
                    text={__('Manage Group', 'kirki-ecommerce')}
                    type="ghost"
                    size="small"
                    onClick={handleGroupManage}
                  />
                  <Button text="Create Group" type="secondary" size="small" />
                </ActionGroup>
              </Flex>
            </Card>
            <Card type="table">
              <CustomerTable />
            </Card>
            <Pagination
              data={data as PaginationData}
              onChange={(page) => handlePaginationChange(page)}
            />
          </Flex>
        ) : (
          <div>Loading...</div>
        )}
      </Container>
    </>
  );
};

export default Customers;
