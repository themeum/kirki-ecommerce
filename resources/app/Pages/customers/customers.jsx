import React from "react";
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import Text from '@/molecules/text';
import CustomerTableAction from "./customer-table/customer-table-action";
import CustomerTable from './customer-table/customer-table';
import { CustomerInfoIcon, ShowMoreIcon } from "@/icons";
import { CLASS_PREFIX, NEW_ITEM_ID } from "@/conf";
import { useNavigate } from "react-router";
import Pagination from '@/components/pagination';
import { useDispatch, useSelector } from "react-redux";
import { useGetListAPI } from "@/hooks";
import { getCustomersAPI, setKeyValue } from "../../store/customersSlice";
import { __ } from "@/wpi18n";

const Customers = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loaded, data } = useSelector((state) => state.customers);
  useGetListAPI({ reducerName: "customers", apiCallBack: getCustomersAPI });
  const handleGroupManage = () => {
    navigate("/customers/groups");
  };
  const handleAddNewCustomer = () => {
    navigate("/customers/" + NEW_ITEM_ID);
  };
  const handlePaginationChange = (value) => {
    dispatch(setKeyValue({ key: "page", value: value }));
  };
  return (
    <>
      <PageHeading
        text={__("Customers", "kirki-ecommerce")}
        actions={
          <Button
            type="primary"
            text={__("Add Customer", "kirki-ecommerce")}
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
                  header={__("Create Groups with Customers", "kirki-ecommerce")}
                  subHeader={__(
                    "Organize customers for better targeting and management",
                    "kirki-ecommerce",
                  )}
                />
                <ActionGroup>
                  <Button
                    text={__("Manage Group", "kirki-ecommerce")}
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
              data={data}
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
