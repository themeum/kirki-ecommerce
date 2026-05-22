import { ArrowDownUp, ListFilter } from "@/Icons";
import { ActionGroup, Button, Flex, Label, Searchbox, Select } from "@/molecules";
import React from "react";

const ActionGroupPreview = () => {
  return (
    <Flex>
      <Label text="This is a random text" />
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

export default ActionGroupPreview;
