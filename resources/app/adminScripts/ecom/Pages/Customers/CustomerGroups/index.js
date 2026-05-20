import React from "react";
import {
  ActionGroup,
  Button,
  Card,
  Container,
  Flex,
  Input,
  PageHeading,
  Select,
} from "molecules";
import CustomerGroupTable from "./CustomerGroupTable";
import { ArrowDownUp, ListFilter } from "icons";

const CustomerGroups = () => {
  const selectOptions = [
    { value: "all", title: "All Groups" },
    { value: "new", title: "New Groups" },
    { value: "top", title: "Top Groups" },
  ];
  return (
    <>
      <PageHeading
        text="Manage Groups"
        type="primary"
        actions={<Button type="primary" text="Create Group" size="small" />}
        style={{ columnGap: "12px" }}
        hasBack
        sticky
      />

      <Container>
        <Card type="table">
          <Flex style={{ padding: "16px 12px" }}>
            <Select
              defaultValue="all"
              optionsArray={selectOptions}
              value="all"
              type="secondary"
            />
            <ActionGroup>
              <Select
                placeholder="Date: This Month"
                style={{ padding: "8px 16px" }}
              />
              <Button
                type="outlined"
                size="small"
                text="Filter"
                leftIcon={<ListFilter />}
              />
              <Button type="outlined" size="small" icon={<ArrowDownUp />} />
              <Input placeholder="Search" />
            </ActionGroup>
          </Flex>
          <CustomerGroupTable />
        </Card>
      </Container>
    </>
  );
};

export default CustomerGroups;
