import { Card, Flex, Text } from "@/molecules";
import React from "react";
import { __ } from "@/wpi18n";
import AttributeList from "./AttributeList";
import VariationTable from "./VariationTable";

const Variants = ({ onSave = () => {} }) => {
  return (
    <Card type="form">
      <Flex>
        <Text
          type={__("primary", "kirki-ecommerce")}
          header={__("Product Variations", "kirki-ecommerce")}
          subHeader={__("Manage the options this product comes in.", "kirki-ecommerce")}
        />
      </Flex>
      <AttributeList onSave={onSave} />
      <VariationTable />
    </Card>
  );
};

export default Variants;
