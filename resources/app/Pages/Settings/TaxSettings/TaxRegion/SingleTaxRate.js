import React from "react";
import { Card, Text, Flex, Input } from "../../../../molecules";
import { CLASS_PREFIX } from "@/conf";
import { __ } from "@/wpi18n";
import { setUnsavedDataStatus } from "../../utils";

export const SingleTaxRate = (props) => {
  const { centralTaxValue, setCentralTaxValue } = props;

  const handleTaxRate = (value) => {
    setCentralTaxValue(value);
    setUnsavedDataStatus(true);
  };
  return (
    <div>
      <Card type={"innerDark"} className={`${CLASS_PREFIX}-tax-card`}>
        <Text type="secondary" header={__("Tax rates", "kirki-ecommerce")} />
        <div className={`${CLASS_PREFIX}-tax-card-content`}>
          <Text
            header={centralTaxValue}
            className={`${CLASS_PREFIX}-rate-display`}
          />

          <Flex gap={8} className={`${CLASS_PREFIX}-edit-group`}>
            <Input
              value={centralTaxValue}
              style={{ width: "72px" }}
              onChange={(value) => handleTaxRate(value)}
              onBlur={(value) => handleTaxRate(value)}
              type="number"
              min={0}
              max={100}
            />
          </Flex>
        </div>
      </Card>
    </div>
  );
};
