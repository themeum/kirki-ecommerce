import { ActionGroup, Button, Card, Flex, SelectInput, Text } from "molecules";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProduct } from "../../../../store/productSlice";
import { __ } from "wpi18n";
import { EyeClosedIcon, EyeIcon } from "icons";
import { useState, useEffect } from "react";
import { BoxGenerator } from "../../../Settings/ShippingSettings/ShippingBox/BoxGenerator";
import ShippingProfile from "./ShippingProfile";
import ShippingBox from "./ShippingBox";

const Shipping = ({ errors, setErrors }) => {
  const dispatch = useDispatch();
  const { data: productData } = useSelector((state) => state.product);
  const { loaded: boxListLoaded, data: shippingBox } = useSelector(
    (state) => state.settings?.shipping?.shippingBox,
  );
  const [boxGeneratorData, setBoxGeneratorData] = useState({});
  const [showShippingBox, setShowShippingBox] = useState(true);

  useEffect(() => {
    if (productData.variants[0]?.shipping_box_id && boxListLoaded) {
      const boxData = shippingBox.find(
        (item) => item.id === productData.variants[0]?.shipping_box_id,
      );
      setBoxGeneratorData(boxData);
    }
  }, [productData.variants[0]?.shipping_box_id, shippingBox]);

  const handleOnVariantInfoChange = (value, fieldName) => {
    if (fieldName === "weight") {
      dispatch(
        updateProduct({ key: "weight", value: value.value, variants: true }),
      );
      dispatch(
        updateProduct({
          key: "weight_unit",
          value: value.unit,
          variants: true,
        }),
      );
      setErrors((prev) => ({
        ...prev,
        [`variants.0.weight`]: null,
        [`variants.0.weight_unit`]: null,
      }));
    } else {
      dispatch(updateProduct({ key: fieldName, value: value, variants: true }));
      setErrors((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    }
  };
  return (
    <Card type="form">
      <Text header={__("Shipping", "kirki-ecommerce")} type="primary" padding="large" />
      <SelectInput
        label={__("Weight", "kirki-ecommerce")}
        value={{
          value: productData?.variants[0].weight || "",
          unit: productData?.variants[0]?.weight_unit || "",
        }}
        optionsArray={[
          { value: "kg", title: __("KG", "kirki-ecommerce"), fallback: true },
          { value: "g", title: __("G", "kirki-ecommerce") },
          { value: "lb", title: __("LB", "kirki-ecommerce") },
          { value: "oz", title: __("OZ", "kirki-ecommerce") },
        ]}
        onChange={(value) => handleOnVariantInfoChange(value, "weight")}
        error={errors?.weight || errors?.weight_unit}
      />
      <div>
        <Card
          type="inner"
          style={{
            position: "relative",
            overflow: "visible",
            marginTop: "16px",
            paddingTop: "20px",
          }}
        >
          <Flex
            style={{
              top: "-18px",
              left: "8px",
              right: "8px",
              position: "absolute",
            }}
          >
            <span
              style={{
                backgroundColor: "#ffffff",
                paddingLeft: "8px",
              }}
            >
              <Text type="secondary" header={__("Shipping Box", "kirki-ecommerce")} />
            </span>
            <ActionGroup>
              <span
                style={{
                  backgroundColor: "#ffffff",
                  paddingRight: "8px",
                }}
              >
                <Button
                  type="secondary"
                  size="small"
                  leftIcon={showShippingBox ? <EyeIcon /> : <EyeClosedIcon />}
                  onClick={() => {
                    setShowShippingBox((prev) => !prev);
                  }}
                />
              </span>
            </ActionGroup>
          </Flex>
          <Flex gap={8} direction="column">
            <ShippingBox
              value={productData?.variants[0]?.shipping_box_id}
              onChange={(value, fieldName) =>
                handleOnVariantInfoChange(value, fieldName)
              }
            />
          </Flex>
        </Card>
        {showShippingBox && (
          <Card
            type="dark"
            style={{
              borderRadius: "0px 0px 6px 6px",
              marginTop: "-8px",
              padding: "4px",
              height: "230px",
            }}
          >
            <BoxGenerator
              length={boxGeneratorData?.length || 0}
              height={boxGeneratorData?.height || 0}
              width={boxGeneratorData?.width || 0}
              unit={boxGeneratorData?.unit || "in"}
            />
          </Card>
        )}
      </div>
      <ShippingProfile
        onChange={(val, fieldName) => handleOnVariantInfoChange(val, fieldName)}
      />
    </Card>
  );
};

export default Shipping;
