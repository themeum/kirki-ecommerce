import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import React from "react";
import { __ } from "@/wpi18n";
import AttributeList from './attribute-list/attribute-list';
import VariationTable from './variation-table/variation-table';

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
