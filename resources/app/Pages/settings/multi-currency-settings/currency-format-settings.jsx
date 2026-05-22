import React from "react";
import { __ } from "@/wpi18n";
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import { Select } from '@/molecules/select';

const CurrencyFormatSettings = ({ handleOnChange, dataObj, errors }) => {
  const optionsArray = [
    { title: __("Comma (,)", "kirki-ecommerce"), value: "," },
    { title: __("Dot (.)", "kirki-ecommerce"), value: "." },
    { title: __("Space", "kirki-ecommerce"), value: "space" },
  ];
  return (
    <Card type="inner" style={{ padding: "16px" }}>
      <Flex direction="column" gap={16}>
        <Select
          label={__("Currency format", "kirki-ecommerce")}
          onChange={(value) => handleOnChange(value, "currency_format")}
          optionsArray={[
            { title: __("Short", "kirki-ecommerce"), value: "short" },
            { title: __("Long", "kirki-ecommerce"), value: "long" },
          ]}
          value={dataObj["currency_format"]}
          error={errors["data.currency_format"]}
        />

        <Select
          label={__("Currency position", "kirki-ecommerce")}
          onChange={(value) => handleOnChange(value, "currency_position")}
          optionsArray={[
            { title: __("Before", "kirki-ecommerce"), value: "before" },
            { title: __("After", "kirki-ecommerce"), value: "after" },
          ]}
          value={dataObj["currency_position"]}
          error={errors["data.currency_position"]}
        />

        <Select
          label={__("Thousands separator", "kirki-ecommerce")}
          onChange={(value) => handleOnChange(value, "thousand_separator")}
          optionsArray={optionsArray}
          value={dataObj["thousand_separator"]}
          error={errors["data.thousand_separator"]}
        />

        <Select
          label={__("Decimals separator", "kirki-ecommerce")}
          onChange={(value) => handleOnChange(value, "decimal_separator")}
          optionsArray={optionsArray}
          value={dataObj["decimal_separator"]}
          error={errors["data.decimal_separator"]}
        />
      </Flex>
    </Card>
  );
};

export default CurrencyFormatSettings;
