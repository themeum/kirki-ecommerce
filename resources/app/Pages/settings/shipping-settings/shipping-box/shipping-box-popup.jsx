import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';

import Text from '@/molecules/text';
import Separator from '@/molecules/separator';
import ActionGroup from '@/molecules/action-group';
import React, { useEffect, useState } from "react";
import { __, sprintf } from "@/wpi18n";
import { Popover, PopoverBody, PopoverHeader } from '@/molecules/popover';
import { Select } from '@/molecules/select';

import {
  createShippingBoxAPI,
  updateShippingBoxAPI,
  setKeyValue,
} from "../../../../store/settingsSlice";
import { BoxGenerator } from './box-generator';
import { dispatchToastMessage } from "../../../utils";
import { getErrorsObject } from "../../../../store/utils";
import { useDispatch, useSelector } from "react-redux";

const ShippingBoxPopup = (props) => {
  const {
    selectedItem = null,
    isOpen,
    onClose = () => {},
    onSave = () => {},
  } = props;
  const dispatch = useDispatch();
  const { data: productSettingsData } = useSelector(
    (state) => state.settings?.product,
  );
  const [shippingBoxData, setShippingBoxData] = useState({});
  const [errors, setErrors] = useState({});
  const UNIT_TO_PX = {
    cm: 10,
    in: 25.4,
  };

  useEffect(() => {
    setShippingBoxData({
      length: selectedItem?.length ?? 120,
      width: selectedItem?.width ?? 80,
      height: selectedItem?.height ?? 80,
      unit: selectedItem?.unit ?? productSettingsData?.dimension_unit ?? "in",
      name: selectedItem?.name ?? "",
      is_default: selectedItem?.is_default || false,
    });
  }, []);

  const handleOnChange = (key, value) => {
    setShippingBoxData((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
    setErrors((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const convertValue = (value, fromUnit, toUnit) => {
    if (!value || fromUnit === toUnit) return value;

    const valueInPx = value * UNIT_TO_PX[fromUnit];
    return +(valueInPx / UNIT_TO_PX[toUnit]).toFixed(2);
  };

  const handleUnitChange = (newUnit) => {
    setShippingBoxData((prev) => {
      const oldUnit = prev.unit;

      return {
        ...prev,
        length: convertValue(prev.length, oldUnit, newUnit),
        width: convertValue(prev.width, oldUnit, newUnit),
        height: convertValue(prev.height, oldUnit, newUnit),
        unit: newUnit,
      };
    });
  };

  const handleCreateOrUpdateBox = async () => {
    let result;
    if (selectedItem) {
      result = await updateShippingBoxAPI(selectedItem?.id, shippingBoxData);
    } else {
      let data = {
        ...shippingBoxData,
        ["is_default"]: false,
      };
      result = await createShippingBoxAPI(data);
    }

    if (result.success) {
      dispatch(
        setKeyValue({
          key: "toggler",
          value: Date.now(),
          nestedToggler: ["shipping", "shippingBox"],
        }),
      );
      onSave(result?.data?.id);
      dispatchToastMessage("success", {
        title: selectedItem
          ? __("Shipping box updated", "kirki-ecommerce")
          : __("Shipping box created", "kirki-ecommerce"),
      });
      handleOnclosePopup();
    } else {
      setErrors(getErrorsObject(result.errors));
    }
  };

  const handleOnclosePopup = () => {
    setShippingBoxData({});
    setErrors({});
    onClose();
  };

  return (
    <Popover
      isOpen={isOpen}
      onClose={handleOnclosePopup}
      style={{ width: "632px", zIndex: "1000" }}
    >
      <PopoverHeader
        style={{ padding: "var(--decom-spacing-5)" }}
        onClose={handleOnclosePopup}
      >
        {selectedItem
          ? __("Edit Shipping Box", "kirki-ecommerce")
          : __("Create shipping box", "kirki-ecommerce")}
      </PopoverHeader>
      <PopoverBody
        style={{
          gap: "25px",
          padding:
            "var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-3) var(--decom-spacing-5)",
        }}
      >
        <Input
          label={__("Title", "kirki-ecommerce")}
          placeholder={__("Regular box", "kirki-ecommerce")}
          value={shippingBoxData?.name}
          onChange={(value) => handleOnChange("name", value)}
          error={errors["name"]}
        />
        <div>
          <Card
            type="inner"
            style={{
              position: "relative",
              overflow: "visible",
              paddingTop: "var(--decom-spacing-5)",
            }}
          >
            <Text
              type="secondary"
              header={__("Dimensions", "kirki-ecommerce")}
              style={{
                top: "-12px",
                left: "240px",
                position: "absolute",
                padding: "var(--decom-spacing-0) var(--decom-spacing-2)",
                backgroundColor: "var(--decom-text-text-light)",
              }}
            />
            <Flex gap={16} style={{ alignItems: "flex-end" }}>
              <Input
                placeholder={__("12", "kirki-ecommerce")}
                label={__("Length", "kirki-ecommerce")}
                type="number"
                value={shippingBoxData?.length}
                onChange={(value) => handleOnChange("length", value)}
                onBlur={(value) => handleOnChange("length", value)}
                error={errors?.length}
                min={0}
                max={1000}
              />
              <Input
                label={__("Width", "kirki-ecommerce")}
                placeholder={__("12", "kirki-ecommerce")}
                type="number"
                value={sprintf(__("%d", "kirki-ecommerce"), shippingBoxData?.width)}
                onChange={(value) => handleOnChange("width", value)}
                onBlur={(value) => handleOnChange("width", value)}
                error={errors?.width}
                min={0}
                max={1000}
              />
              <Input
                label={__("Height", "kirki-ecommerce")}
                placeholder={__("12", "kirki-ecommerce")}
                type="number"
                value={shippingBoxData?.height}
                onChange={(value) => handleOnChange("height", value)}
                onBlur={(value) => handleOnChange("height", value)}
                error={errors?.height}
                min={0}
                max={1000}
              />
              <Select
                value={shippingBoxData?.unit}
                onChange={handleUnitChange}
                style={{ width: "70px", gap: "0" }}
                optionsArray={[
                  { title: __("cm", "kirki-ecommerce"), value: "cm" },
                  { title: __("in", "kirki-ecommerce"), value: "in" },
                ]}
                helpText={errors?.unit}
                error={errors?.unit}
              />
            </Flex>
          </Card>
          <Card
            type="dark"
            style={{
              borderRadius:
                "var(--decom-radius-rounded-none) var(--decom-radius-rounded-none) var(--decom-radius-rounded-md) var(--decom-radius-rounded-md)",
              marginTop: "-8px",
              padding: "var(--decom-spacing-1)",
              height: "230px",
            }}
          >
            <BoxGenerator
              length={Number(shippingBoxData.length) || 0}
              width={Number(shippingBoxData.width) ?? 0}
              height={Number(shippingBoxData.height) ?? 0}
              unit={shippingBoxData?.unit}
            />
          </Card>
        </div>
      </PopoverBody>
      <Flex
        direction={"column"}
        style={{ padding: "var(--decom-spacing-0) var(--decom-spacing-5)" }}
      >
        <Separator style={{ margin: "var(--decom-spacing-0)" }} />
        <ActionGroup
          style={{
            padding: "var(--decom-spacing-3) var(--decom-spacing-0)",
            gap: "var(--decom-spacing-2)",
          }}
        >
          <Button
            type="outlined"
            text={__("Cancel", "kirki-ecommerce")}
            size="small"
            onClick={handleOnclosePopup}
          />
          <Button
            type="primary"
            text={selectedItem ? __("Update", "kirki-ecommerce") : __("Add", "kirki-ecommerce")}
            size="small"
            onClick={handleCreateOrUpdateBox}
          />
        </ActionGroup>
      </Flex>
    </Popover>
  );
};

export default ShippingBoxPopup;
