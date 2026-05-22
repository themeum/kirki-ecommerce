import React from "react";
import {
  Card,
  Text,
  Flex,
  Input,
  Select,
  Grid,
  Checkbox,
  Button,
  ActionGroup,
} from "../../../molecules";
import CountrySelector from "../../../components/CountrySelector";
import { __ } from "@/wpi18n";

const BarcodeGeneration = (props) => {
  const { dataObj, handleOnChange, errors } = props;
  return (
    <div>
      <Card type="large">
        <Text
          header={__("Barcode Generation", "kirki-ecommerce")}
          subHeader={__(
            "Select a unit for your store's product weight and dimensions.",
            "kirki-ecommerce",
          )}
          type="primary"
          style={{ gap: "12px" }}
        />

        <Card type="inner" style={{ padding: "16px" }}>
          <Flex direction="column" gap={16}>
            <Select
              label={__("Data origin", "kirki-ecommerce")}
              // value={dataObj?.["barcode_generation"]?.["data_origin"]}
              // onChange={(value) => handleOnChange(value, "data_origin")}
              optionsArray={[{ title: __("SKU", "kirki-ecommerce"), value: "sku" }]}
              defaultValue="sku"
              // error={errors["data.data_origin"]}
            />
            <Select
              label={__("Format", "kirki-ecommerce")}
              // value={dataObj?.["barcode_generation"]?.["format"]}
              // onChange={(value) => handleOnChange(value, "format")}
              optionsArray={[
                {
                  title: __(
                    "Code 128 (recommended for SKU/internal use)",
                    "kirki-ecommerce",
                  ),
                  value: "sku",
                },
              ]}
              defaultValue="sku"
              // error={errors["data.format"]}
            />
            <Grid>
              <Input
                label={__("Width", "kirki-ecommerce")}
                type="number"
                // value={dataObj?.["barcode_generation"]?.["width"]}
                // onChange={(value) => handleOnChange(value, "width")}
                placeholder={__("2.5", "kirki-ecommerce")}
                // error={errors["data.width"]}
              />

              <Input
                label={__("Height", "kirki-ecommerce")}
                type="number"
                // value={dataObj?.["barcode_generation"]?.["height"]}
                // onChange={(value) => handleOnChange(value, "height")}
                placeholder={__("2.5", "kirki-ecommerce")}
                // error={errors["data.height"]}
              />
            </Grid>

            <CountrySelector
              label={__("Country of origin", "kirki-ecommerce")}
              // value={dataObj?.["barcode_generation"]?.["country_of_origin"]}
              // onChange={(value) => handleOnChange(value, "country_of_origin")}
              // error={errors["data.country_of_origin"]}
            />

            <Checkbox
              label={__("Show human-readable text under barcode", "kirki-ecommerce")}
              // value={
              //   dataObj?.["barcode_generation"]?.[
              //     "is_human_readable_text_visible"
              //   ]
              // }
              // onChange={(value) =>
              //   handleOnChange(value, "is_human_readable_text_visible")
              // }
              // error={errors["data.is_human_readable_text_visible"]}
            />
            <Checkbox
              // value={
              //   dataObj?.["barcode_generation"]?.["is_product_name_visible"]
              // }
              label={__("Include product name above barcode", "kirki-ecommerce")}
              // onChange={(value) =>
              //   handleOnChange(value, "is_product_name_visible")
              // }
              // error={errors["data.is_product_name_visible"]}
            />
            <Checkbox
              // value={
              //   dataObj?.["barcode_generation"]?.[
              //     "is_country_of_origin_visible"
              //   ]
              // }
              label={__("Include country of origin", "kirki-ecommerce")}
              // onChange={(value) =>
              //   handleOnChange(value, "is_country_of_origin_visible")
              // }
              // error={errors["data.is_country_of_origin_visible"]}
            />
          </Flex>
        </Card>
        <Card
          type="innerDark"
          style={{
            height: "158px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #E4E3E9",
          }}
        >
          <span>
            <img src="https://kirki-ecommerce.test/wp-content/uploads/2025/10/Screenshot-2025-07-24-at-2.29.50-PM-1.png" />
          </span>
        </Card>
        <Card type="inner" style={{ padding: "16px" }}>
          <Flex>
            <Flex direction="column" gap={6}>
              <Text
                type="secondary"
                header={__("Generate barcodes for all products", "kirki-ecommerce")}
              />
              <Text
                type="primary"
                subHeader={__(
                  "Enable this option to let customers submit product reviews",
                  "kirki-ecommerce",
                )}
              />
            </Flex>
            <ActionGroup>
              <Button text={__("Generate", "kirki-ecommerce")} type="secondary" />
            </ActionGroup>
          </Flex>
        </Card>
      </Card>
    </div>
  );
};

export default BarcodeGeneration;
