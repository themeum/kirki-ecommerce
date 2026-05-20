import React from "react";
import { Card, Text, Select } from "../../../molecules";
import { useSelector } from "react-redux";
import { __ } from "wpi18n";

export const ShopPage = (props) => {
  const { dataObj, handleOnChange, errors } = props;
  const { data: pageList } = useSelector((state) => state.pages);

  const shopPageOptions = Array.isArray(pageList)
    ? pageList.map((page) => ({
        title: page.title,
        value: page.id,
      }))
    : [];
  return (
    <div>
      <Card type="large">
        <Text
          header={__("Shop page", "kirki-ecommerce")}
          subHeader={__(
            "Choose the page that customers will be directed to when they click Continue Shopping.",
            "kirki-ecommerce"
          )}
          type="primary"
          style={{ gap: "var(--decom-spacing-f3)" }}
        />

        <Card type="inner" style={{ padding: "var(--decom-spacing-4)" }}>
          <Select
            label={__("Shop page", "kirki-ecommerce")}
            value={dataObj?.["shop_page"]}
            onChange={(value) => handleOnChange(value, "shop_page")}
            optionsArray={shopPageOptions}
            placeholder={__("Select Page", "kirki-ecommerce")}
            error={errors["data.shop_page"]}
          />
        </Card>
      </Card>
    </div>
  );
};
