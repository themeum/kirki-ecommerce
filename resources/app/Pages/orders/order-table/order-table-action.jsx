import { ArrowDownUp, ListFilter } from "@/icons";
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import Select from '@/molecules/select/select';
import React from "react";

const OrderTableAction = () => {
  const selectOptions = [
    { value: "all", title: "All Orders" },
    { value: "new", title: "New Orders" },
    { value: "top", title: "Top Orders" },
  ];
  return (
    <Flex style={{ padding: "16px 12px" }}>
      <Select
        defaultValue="all"
        optionsArray={selectOptions}
        value="new"
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
        <Searchbox placeholder="Search" />
      </ActionGroup>
    </Flex>
  );
};

export default OrderTableAction;
