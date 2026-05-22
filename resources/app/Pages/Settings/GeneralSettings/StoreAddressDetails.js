import React from "react";
import { Card, Text, Flex, Input } from "../../../molecules";
import { CountrySelector } from "../../../components";
import { __ } from "@/wpi18n";

const StoreAddressDetails = (props) => {
  const { dataObj, handleOnChange, errors } = props;
  return (
    <div>
      <Card type="large">
        <Text
          header={__("Store address", "kirki-ecommerce")}
          subHeader={__(
            "Configure your store's physical address here.",
            "kirki-ecommerce"
          )}
          type="primary"
          style={{ gap: "var(--decom-spacing-f3)" }}
        />

        <Card type="inner" style={{ padding: "var(--decom-spacing-4)" }}>
          <Flex direction="column" gap={16}>
            <Input
              label={__("Address Line 1", "kirki-ecommerce")}
              placeholder={__("Address line 1", "kirki-ecommerce")}
              value={dataObj?.["store_address"]?.["address_line_1"]}
              type="text"
              onChange={(value) => handleOnChange(value, "address_line_1")}
              error={errors["data.address_line_1"]}
            />

            <Input
              label={__("Address Line 2", "kirki-ecommerce")}
              placeholder={__("Address line 2", "kirki-ecommerce")}
              type="text"
              value={dataObj?.["store_address"]?.["address_line_2"]}
              onChange={(value) => handleOnChange(value, "address_line_2")}
              error={errors["data.address_line_2"]}
            />

            <Input
              label={__("City", "kirki-ecommerce")}
              placeholder={__("Enter city", "kirki-ecommerce")}
              type="text"
              value={dataObj?.["store_address"]?.["city"]}
              onChange={(value) => handleOnChange(value, "city")}
              error={errors["data.city"]}
            />

            <Input
              label={__("Postcode / Zip", "kirki-ecommerce")}
              placeholder={__("Enter Postcode / Zip", "kirki-ecommerce")}
              type="text"
              value={dataObj?.["store_address"]?.["zip_code"]}
              onChange={(value) => handleOnChange(value, "zip_code")}
              error={errors["data.zip_code"]}
            />

            <CountrySelector
              label={__("Country", "kirki-ecommerce")}
              value={dataObj?.["store_address"]?.["country"]}
              onChange={(value) => handleOnChange(value, "country")}
              error={errors["data.country"]}
            />
          </Flex>
        </Card>
      </Card>
    </div>
  );
};

export default StoreAddressDetails;
