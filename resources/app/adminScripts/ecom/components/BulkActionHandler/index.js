import { CLASS_PREFIX } from "conf";
import { ActionGroup, Button, Flex, Select, Text } from "molecules";
import React from "react";
import { useState } from "react";
import { __, sprintf } from "wpi18n";

const BulkActionHandler = (props) => {
  const {
    itemCount,
    optionsArray,
    onSelectAll = false,
    onApply = () => {},
    className = "",
    style = {},
    filterAction,
    total,
    per_page,
  } = props;
  const [selectAction, setSelectAction] = useState(null);
  const handleActionChange = (actionName) => {
    setSelectAction(actionName);
  };

  return (
    <div
      className={`${CLASS_PREFIX}-bulk-action-bar ${className}`}
      style={style}
    >
      <Flex gap={20}>
        <Flex gap={10} style={{ alignItems: "center" }}>
          <Text
            subHeader={`${itemCount} ${
              itemCount > 1 ? "items" : "item"
            } selected`}
            type="xsm"
          />
          {onSelectAll && total > per_page && (
            <Button
              type="blank"
              text={
                itemCount === total
                  ? sprintf(__("Deselect All %d items", "kirki-ecommerce"), total)
                  : sprintf(__("Select All %d items", "kirki-ecommerce"), total)
              }
              onClick={onSelectAll}
            />
          )}
        </Flex>
        {optionsArray && (
          <Flex gap={8} style={{ alignItems: "center" }}>
            <Select
              optionsArray={optionsArray}
              onChange={handleActionChange}
              style={{ minWidth: "100px" }}
            />
            <Button
              text={__("Apply", "kirki-ecommerce")}
              type="secondary"
              size="small"
              onClick={() => onApply(selectAction)}
              state={!selectAction && "disabled"}
            />
          </Flex>
        )}
        {filterAction && <ActionGroup>{filterAction}</ActionGroup>}
      </Flex>
    </div>
  );
};

export default BulkActionHandler;
