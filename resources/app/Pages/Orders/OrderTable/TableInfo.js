import { CLASS_PREFIX } from "@/conf";
import { InfoIcon } from "@/Icons";
import { ActionGroup, Button, Flex, Select } from "@/molecules";
import React from "react";

const TableInfo = () => {
  return (
    <Flex>
      <Flex gap={32} style={{ alignItems: "center" }}>
        <Flex gap={4}>
          <span>Sales</span>
          <span style={{ fontWeight: "500" }}>$11,200</span>
          <span className={`${CLASS_PREFIX}-svg-class`}>
            <InfoIcon />
          </span>
        </Flex>
        <Flex gap={4}>
          <span>Orders</span>
          <span style={{ fontWeight: "500" }}>12</span>
          <span className={`${CLASS_PREFIX}-svg-class`}>
            <InfoIcon />
          </span>
        </Flex>
        <Flex gap={4}>
          <span>Avg. order value</span>
          <span style={{ fontWeight: "500" }}>$5,600</span>
          <span className={`${CLASS_PREFIX}-svg-class`}>
            <InfoIcon />
          </span>
        </Flex>
      </Flex>
      <ActionGroup>
        <Select placeholder="This Week" style={{ padding: "8px 16px" }} />
        <Button type="secondary" size="small" text="Go to Analytics" />
      </ActionGroup>
    </Flex>
  );
};

export default TableInfo;
