import React from "react";
import {
  Card,
  Text,
  Flex,
  Select,
  ToggleButton,
  ActionGroup,
} from "../../../molecules";
import { weightUnitList, dimensionUnitList } from "../utils";
import { __ } from "@/wpi18n";

export const StandardUnit = (props) => {
  const { dataObj, handleOnChange, errors } = props;
  return (
    <div>
      <Card type="large">
        <Text
          header={__("Standards", "kirki-ecommerce")}
          subHeader={__(
            "Select a unit for your store's product weight and dimensions.",
            "kirki-ecommerce"
          )}
          type="primary"
          style={{ gap: "var(--decom-spacing-f3)" }}
        />
        <Flex direction={"column"} gap={8}>
          <Card
            style={{
              borderRadius: "var(--decom-radius-rounded-lg)",
              border: "1px solid var(--decom-border-border)",
            }}
          >
            <Flex direction="column" gap={16}>
              <Select
                label={__("Weight unit", "kirki-ecommerce")}
                value={dataObj?.["weight_unit"] || "kg"}
                onChange={(value) => handleOnChange(value, "weight_unit")}
                optionsArray={weightUnitList}
                error={errors["data.weight_unit"]}
              />
              <Select
                label={__("Dimension unit", "kirki-ecommerce")}
                value={dataObj?.["dimension_unit"] || "m"}
                onChange={(value) => handleOnChange(value, "dimension_unit")}
                optionsArray={dimensionUnitList}
                error={errors["data.dimension_unit"]}
              />
            </Flex>
          </Card>
          <Card
            style={{
              borderRadius: "var(--decom-radius-rounded-lg)",
              border: "1px solid var(--decom-border-border)",
            }}
          >
            <Flex>
              <Flex direction="column" gap={6}>
                <Text
                  type="secondary"
                  header={__("Show unit price", "kirki-ecommerce")}
                />
                <Text
                  type="primary"
                  subHeader={__(
                    "Enable to show unit price in your products",
                    "kirki-ecommerce"
                  )}
                />
              </Flex>
              <ActionGroup>
                <ToggleButton
                  value={dataObj?.is_unit_price_visible}
                  onChange={(value) =>
                    handleOnChange(value, "is_unit_price_visible")
                  }
                  error={errors["data.is_unit_price_visible"]}
                />
              </ActionGroup>
            </Flex>
          </Card>
        </Flex>
      </Card>
    </div>
  );
};
