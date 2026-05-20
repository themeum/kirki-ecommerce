import {
  Card,
  Checkbox,
  Flex,
  Grid,
  Input,
  Select,
  Separator,
  Text,
} from "molecules";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProduct } from "../../../../store/productSlice";
import { __ } from "wpi18n";
import BaseUnitPopup from "./BaseUnitPopup";
import { calculateProfit } from "../../../utils";
import { useState } from "react";
import { useEffect } from "react";
import { TaxProfilePopup } from "../../../Settings/TaxSettings/TaxProfile/TaxProfilePopup";
import { useGetListAPI } from "hooks";
import { getTaxProfileListAPI } from "../../../../store/settingsSlice";

const Price = ({ errors, setErrors }) => {
  const dispatch = useDispatch();
  const [taxProfileList, setTaxProfileList] = useState([]);
  const [openTaxProfilePopup, setOpenTaxProfilePopup] = useState(false);
  const { data: productData } = useSelector((state) => state?.product);
  useGetListAPI({
    reducerName: "settings",
    apiCallBack: getTaxProfileListAPI,
    nestedToggler: ["tax", "taxProfile"],
    limit: -1,
  });
  const { loaded: taxLoaded, data: taxProfile } = useSelector(
    (state) => state?.settings?.tax?.taxProfile,
  );

  useEffect(() => {
    if (taxLoaded) formatTaxProfileList();
  }, [taxProfile]);

  const handleOnVariantInfoChange = (value, fieldName) => {
    dispatch(
      updateProduct({
        key: fieldName,
        value: value,
        variants: true,
      }),
    );
    setErrors((prev) => ({
      ...prev,
      [`variants.0.${fieldName}`]: null,
    }));
  };

  const formatTaxProfileList = () => {
    const updatedData = taxProfile?.map((item) => ({
      value: item?.id,
      title: item?.name,
    }));

    setTaxProfileList(updatedData);
  };

  return (
    <Card type="form">
      <Text header={__("Price", "kirki-ecommerce")} type="primary" padding="large" />
      <Grid columns={2}>
        <Input
          leftSymbol={productData?.currency?.symbol || "$"}
          style={{ textIndent: "12px" }}
          value={productData?.variants[0]?.price}
          label={__("Regular price", "kirki-ecommerce")}
          placeholder={__("29.00", "kirki-ecommerce")}
          type="number"
          onChange={(value) => handleOnVariantInfoChange(value, "price")}
          error={errors["variants.0.price"]}
        />
        <Input
          value={productData?.variants[0]?.sale_price}
          leftSymbol={productData?.currency?.symbol || "$"}
          style={{ textIndent: "12px" }}
          label={__("Sale price", "kirki-ecommerce")}
          placeholder={__("19.99", "kirki-ecommerce")}
          type="number"
          onChange={(value) => handleOnVariantInfoChange(value, "sale_price")}
          error={errors["variants.0.sale_price"]}
        />
      </Grid>

      <Flex direction="column" gap={8}>
        <Card
          type="innerDark"
          style={{
            padding: "4px 8px 4px 12px",
            height: "44px",
          }}
        >
          <Flex
            style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Checkbox
              style={{ flex: "1" }}
              value={productData?.variants[0]?.show_unit_price}
              label={__("Show unit price", "kirki-ecommerce")}
              helpText={__("Show unit price", "kirki-ecommerce")}
              onChange={(value) =>
                handleOnVariantInfoChange(value, "show_unit_price")
              }
              error={errors["variants.0.show_unit_price"]}
            />
            <div>
              <Flex
                gap={8}
                style={{
                  flex: "2",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  visibility: productData?.variants[0]?.show_unit_price
                    ? "visible"
                    : "hidden",
                }}
              >
                <Text subHeader={__("Base price per unit", "kirki-ecommerce")} />
                <BaseUnitPopup
                  errors={errors}
                  setErrors={setErrors}
                  data={productData?.variants[0]}
                  onChange={(value) =>
                    handleOnVariantInfoChange(value, "base_price_per_unit")
                  }
                />
              </Flex>
            </div>
          </Flex>
        </Card>

        <Card
          type="innerDark"
          style={{
            padding: "4px 8px 4px 12px",
            height: "44px",
          }}
        >
          <Grid style={{ alignItems: "center" }}>
            <Checkbox
              value={productData?.variants[0]?.charge_taxes || false}
              label={__("Charge tax on this product", "kirki-ecommerce")}
              helpText={__("Charge tax on this product", "kirki-ecommerce")}
              onChange={(value) =>
                handleOnVariantInfoChange(value, "charge_taxes")
              }
              error={errors["variants.0.charge_taxes"]}
            />

            <Select
              value={productData?.variants[0]?.tax_profile_id}
              style={{
                visibility: productData?.variants[0]?.charge_taxes
                  ? "visible"
                  : "hidden",
              }}
              btnText="Add Tax Profile"
              onNewItemAdd={() => setOpenTaxProfilePopup(true)}
              optionsArray={taxProfileList}
              onChange={(value) =>
                handleOnVariantInfoChange(value, "tax_profile_id")
              }
            />
          </Grid>
        </Card>
      </Flex>

      <Separator />

      <Grid columns={3}>
        <Input
          value={productData?.variants[0].cost_of_goods || ""}
          leftSymbol={
            productData?.variants[0].cost_of_goods
              ? productData?.currency?.symbol || "$"
              : null
          }
          label={__("Cost of goods", "kirki-ecommerce")}
          placeholder={__("--", "kirki-ecommerce")}
          type="number"
          onChange={(value) =>
            handleOnVariantInfoChange(value, "cost_of_goods")
          }
          error={errors["variants.0.cost_of_goods"]}
        />
        <Input
          value={calculateProfit("profit", productData?.variants[0])}
          label={__("Profit", "kirki-ecommerce")}
          type="number"
          leftSymbol={productData?.currency?.symbol || "$"}
          state="disabled"
        />
        <Input
          value={calculateProfit("margin", productData?.variants[0])}
          label={__("Margin(%)", "kirki-ecommerce")}
          type="number"
          state="disabled"
        />
      </Grid>
      <TaxProfilePopup
        isOpen={openTaxProfilePopup}
        onClose={() => setOpenTaxProfilePopup(false)}
        onSave={(value) => handleOnVariantInfoChange(value, "tax_profile_id")}
      />
    </Card>
  );
};

export default Price;
