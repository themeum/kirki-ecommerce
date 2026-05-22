import { ArrowDownUp, ListFilter } from "@/icons";
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
import Searchbox from '@/molecules/searchbox';

import React from "react";
import { Select } from '@/molecules/select';

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
