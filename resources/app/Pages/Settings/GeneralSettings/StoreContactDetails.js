import React from "react";
import { Card, Text, Flex, Input } from "../../../molecules";
import { ThumbnailSelector } from "../../../components";
import { __ } from "@/wpi18n";

const StoreContactDetails = (props) => {
  const { dataObj, storeLogo, handleOnChange, errors } = props;
  return (
    <>
      <Card type="large">
        <Text
          header={__("Store Contact Details", "kirki-ecommerce")}
          subHeader={__("Set up your store's contact information", "kirki-ecommerce")}
          type="primary"
          style={{ gap: "var(--decom-spacing-f3)" }}
        />

        <Card type="inner" style={{ padding: "var(--decom-spacing-4)" }}>
          <Flex direction="column" gap={16}>
            <Input
              label={__("Store Name", "kirki-ecommerce")}
              placeholder={__("Enter your store name", "kirki-ecommerce")}
              type="text"
              value={dataObj?.["store_name"]}
              onChange={(value) => handleOnChange(value, "store_name")}
              error={errors["data.store_name"]}
            />

            <ThumbnailSelector
              label={__("Store Logo", "kirki-ecommerce")}
              src={storeLogo}
              helpText={__("Set store logo", "kirki-ecommerce")}
              onChange={(img) => handleOnChange(img, "store_logo")}
              error={errors["data.store_logo"]}
            />

            <Input
              label={__("Store Email", "kirki-ecommerce")}
              placeholder={__("Enter your store email", "kirki-ecommerce")}
              type="text"
              value={dataObj?.["store_email"]}
              onChange={(value) => handleOnChange(value, "store_email")}
              error={errors["data.store_email"]}
            />

            <Input
              label={__("Store Phone", "kirki-ecommerce")}
              placeholder={__("Enter your store phone", "kirki-ecommerce")}
              value={dataObj?.["store_phone"]}
              onChange={(value) => handleOnChange(value, "store_phone")}
              error={errors["data.store_phone"]}
            />
          </Flex>
        </Card>
      </Card>
    </>
  );
};

export default StoreContactDetails;
