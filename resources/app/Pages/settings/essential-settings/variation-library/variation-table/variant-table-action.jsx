import React, { useState } from "react";
import { __ } from "@/wpi18n";
import { ArrowDownUp } from "@/icons";
import Flex from '@/molecules/flex';
import Button from '@/molecules/button';
import ActionGroup from '@/molecules/action-group';
import Searchbox from '@/molecules/searchbox';
import { getSortedList } from "../../../utils";

const VariantTableAction = (props) => {
  const { dataList, updateDataList, setSearchValue, searchValue } = props;

  const [sortOrder, setSortOrder] = useState("desc");

  const handleSortChange = () => {
    const nextOrder = sortOrder === "asc" ? "desc" : "asc";
    const sortedList = getSortedList({
      data: dataList,
      key: "value",
      order: nextOrder,
    });

    setSortOrder(nextOrder);
    updateDataList(sortedList);
  };

  return (
    <Flex style={{ padding: "var(--decom-spacing-4) var(--decom-spacing-5)" }}>
      <div style={{ width: "160px" }}>
        <Searchbox
          onChange={(value) => setSearchValue(value)}
          value={searchValue}
        />
      </div>
      <ActionGroup>
        <Button
          type="outlined"
          size="small"
          icon={<ArrowDownUp />}
          onClick={handleSortChange}
        />
      </ActionGroup>
    </Flex>
  );
};

export default VariantTableAction;
