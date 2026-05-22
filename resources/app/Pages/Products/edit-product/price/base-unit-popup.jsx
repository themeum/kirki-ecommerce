import { ChevronDownIcon } from "@/icons";
import Button from '@/molecules/button';
import DropdownMenuContent from '@/molecules/dropdown/dropdown-menu-content';
import Flex from '@/molecules/flex';
import SelectInput from '@/molecules/select-input';
import React from "react";
import { __ } from "@/wpi18n";
import { getSpecifiedUnitList, normalizedUnit, unitList } from './utils';
import { useState, useRef, useEffect } from "react";

const BaseUnitPopup = ({ errors, onChange, buttonProps, setErrors, data }) => {
  const totalUnitAnchorRef = useRef(null);
  const baseUnitAnchorRef = useRef(null);
  const popoverRef = useRef(null);
  const [openUnitPopup, setOpenUnitPopup] = useState(false);
  const [unitData, setUnitData] = useState({
    total_unit_amount: data?.total_unit_amount,
    total_unit: data?.total_unit,
    base_unit_amount: data?.base_unit_amount,
    base_unit: data?.base_unit,
    price: data?.price,
  });

  useEffect(() => {
    setUnitData((prev) => ({
      ...prev,
      total_unit_amount: data?.total_unit_amount,
      total_unit: data?.total_unit,
      base_unit_amount: data?.base_unit_amount,
      base_unit: data?.base_unit,
      price: data?.price,
    }));
  }, [data]);

  const basePricePerBaseUnitAmount = () => {
    const {
      total_unit_amount,
      total_unit,
      base_unit_amount,
      base_unit,
      price,
    } = unitData;

    // convert total amount to grams
    const totalAmountInGrams = total_unit_amount * normalizedUnit[total_unit];

    // convert base unit amount to grams
    const baseAmountInGrams = base_unit_amount * normalizedUnit[base_unit];

    // how many base units exist in total
    const numberOfBaseUnits = totalAmountInGrams / baseAmountInGrams;

    // price per base unit amount
    const basePricePerUnit = price / numberOfBaseUnits;
    return basePricePerUnit;
  };
  const handleOnVariantInfoChange = (value, fieldName) => {
    if (fieldName === "total") {
      setUnitData((prev) => ({
        ...prev,
        total_unit_amount: value.value,
        total_unit: value.unit,
      }));
    } else {
      setUnitData((prev) => ({
        ...prev,
        base_unit_amount: value.value,
        base_unit: value.unit,
      }));
    }
  };

  const handleSaveUnitData = () => {
    onChange(unitData);
    setOpenUnitPopup(false);
  };

  const handleOnClose = () => {
    setUnitData((prev) => ({
      ...prev,
      total_unit_amount: data?.total_unit_amount,
      total_unit: data?.total_unit,
      base_unit_amount: data?.base_unit_amount,
      base_unit: data?.base_unit,
      price: data?.price,
    }));
    setOpenUnitPopup(false);
  };

  const btnText = basePricePerBaseUnitAmount()
    ? `${basePricePerBaseUnitAmount().toFixed(2)} / ${
        unitData.base_unit_amount
      }${unitData.base_unit}`
    : __("Add", "kirki-ecommerce");

  return (
    <>
      <Button
        type="outlined"
        text={btnText}
        style={{ width: "240px" }}
        rightIcon={<ChevronDownIcon />}
        onClick={() => setOpenUnitPopup((prev) => !prev)}
        ref={popoverRef}
        size="fullWidth"
        contentStyle={{ justifyContent: "space-between" }}
        {...buttonProps}
      />
      <DropdownMenuContent
        isOpen={openUnitPopup}
        triggerRef={popoverRef}
        onClose={() => setOpenUnitPopup(false)}
      >
        <Flex direction="column" gap={16} style={{ padding: "16px" }}>
          <Flex direction="column" gap={12}>
            <div ref={totalUnitAnchorRef}>
              <SelectInput
                label={__("Total unit in product", "kirki-ecommerce")}
                min={0}
                value={{
                  value: unitData?.total_unit_amount || "",
                  unit: unitData?.total_unit,
                }}
                optionsArray={unitList}
                onChange={(value) => handleOnVariantInfoChange(value, "total")}
                error={errors?.total_unit_amount || errors?.total_unit}
                anchorRef={totalUnitAnchorRef}
                selectWidth="50%"
              />
            </div>
            <div ref={baseUnitAnchorRef}>
              <SelectInput
                label={__("Base unit", "kirki-ecommerce")}
                min={0}
                value={{
                  value: unitData?.base_unit_amount || "",
                  unit: unitData?.base_unit,
                }}
                optionsArray={getSpecifiedUnitList(unitData?.total_unit)}
                onChange={(value) => handleOnVariantInfoChange(value, "base")}
                error={errors?.base_unit_amount || errors?.base_unit}
                anchorRef={baseUnitAnchorRef}
                selectWidth="50%"
              />
            </div>
          </Flex>
          <Flex>
            <Button
              type="ghost"
              text={__("Cancel", "kirki-ecommerce")}
              size="fullWidth"
              onClick={handleOnClose}
            />
            <Button
              type="primary"
              text={__("Okay", "kirki-ecommerce")}
              size="fullWidth"
              state={basePricePerBaseUnitAmount() ? "" : "disabled"}
              onClick={handleSaveUnitData}
            />
          </Flex>
        </Flex>
      </DropdownMenuContent>
    </>
  );
};

export default BaseUnitPopup;
