import React from "react";
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Checkbox from '@/molecules/checkbox';
import { __ } from "@/wpi18n";

const FlatRateSettings = (props) => {
  const { handleOnChange, dataObj } = props;
  return (
    <Flex direction="column" gap={16}>
      <Input
        label={__("Rate", "kirki-ecommerce")}
        value={dataObj?.amount || ""}
        type="number"
        placeholder={__("$0.00", "kirki-ecommerce")}
        onChange={(value) => handleOnChange(value, "amount")}
      />

      <Checkbox
        value={dataObj?.["is_taxable"] || false}
        label={__("This method is taxable", "kirki-ecommerce")}
        onChange={(value) => handleOnChange(value, "is_taxable")}
      />

      <Input
        multiline
        value={dataObj?.description || ""}
        label={__("Description", "kirki-ecommerce")}
        placeholder={__("e.g., 3–5 business days", "kirki-ecommerce")}
        onChange={(value) => handleOnChange(value, "description")}
        style={{
          padding: "var(--decom-spacing-2) var(--decom-spacing-3)",
          minHeight: "108px",
        }}
      />
    </Flex>
  );
};

export default FlatRateSettings;
