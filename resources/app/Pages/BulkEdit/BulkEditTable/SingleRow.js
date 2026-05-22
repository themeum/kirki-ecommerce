import { Checkbox, Flex, Input, Select, TableCell, TableRow } from "@/molecules";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CLASS_PREFIX } from "@/conf";
import { useEffect, useState } from "react";
import { __ } from "@/wpi18n";
import { useBulkEditList } from "@/hooks";
import BaseUnitPopup from "../../Products/EditProduct/Price/BaseUnitPopup";
import { updateBulkVariants } from "../../../store/BulkEditSlice";
import { ThumbnailSelector } from "@/components";
import { calculateProfit } from "../../utils";
import ShippingBox from "../../Products/EditProduct/Shipping/ShippingBox";

const SingleRow = (props) => {
  const {
    index,
    selectionData,
    setSelectionData,
    isDragging,
    setIsDragging,
    selectedFields,
  } = props;

  const { variants } = useSelector((state) => state.bulk?.data);
  const attributes = useSelector((state) => state.attributes?.data); // updated data selection in redux
  const currentVariation = variants[index];
  const [varTitle, setVarTitle] = useState([]);
  const dispatch = useDispatch();

  const { isSelected, isFilled, getVariantList, getActiveState } =
    useBulkEditList({
      selectionData,
      index,
    });

  useEffect(() => {
    const attributeValueMap = Object.fromEntries(
      (attributes || []).flatMap((attr) =>
        attr.values.map((v) => [v.id, v.value])
      )
    );

    const variatioNames = currentVariation?.attribute_values.map(
      (valueId) => attributeValueMap[valueId]
    );
    setVarTitle(variatioNames);
  }, [attributes]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (!selectionData || selectionData.mode !== "fill") {
        setIsDragging(false);
        return;
      }

      const variantIndexes = getVariantList("fill");
      if (selectionData?.fieldName === "base_price_per_unit") {
        handleUnitInfoChange(variantIndexes);
      } else {
        const sourceValue =
          variants[selectionData.baseIndex][selectionData.fieldName];

        dispatch(
          updateBulkVariants({
            key: selectionData.fieldName,
            value: sourceValue,
            variant_index: variantIndexes,
          })
        );
      }
      setSelectionData((prev) => ({
        ...prev,
        mode: "select",
        end: prev.lastIndex,
      }));
      setIsDragging(false);
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [selectionData]);

  const handleOnChange = (value, fieldName) => {
    if (selectionData.start === selectionData.end) {
      dispatch(
        updateBulkVariants({
          key: fieldName,
          value: value,
          variant_index: [index],
        })
      );
      return;
    }

    applyValue(value, fieldName);
  };

  const applyValue = (value, fieldName) => {
    if (!selectionData) return;

    const variantIndexes = getVariantList("select");

    if (fieldName === "base_price_per_unit") {
      handleUnitInfoChange(variantIndexes, value);
    } else {
      dispatch(
        updateBulkVariants({
          key: fieldName || selectionData.fieldName,
          value: value,
          variant_index: variantIndexes,
        })
      );
    }
  };

  const onCellMouseDown = (e, fieldName) => {
    setIsDragging(true);
    if (!isSelected(fieldName)) {
      setSelectionData({
        fieldName,
        start: index,
        end: index,
        mode: "select",
        baseIndex: index,
        lastIndex: index,
      });
    }
  };

  const onCellMouseEnter = (e, fieldName) => {
    if (!isDragging) return;
    e.preventDefault();
    if (selectionData?.mode === "select") {
      setSelectionData((prev) => {
        if (!prev) return prev;
        return { ...prev, end: index };
      });
    } else {
      setSelectionData((prev) => {
        if (!prev) return prev;
        return { ...prev, lastIndex: index };
      });
    }
  };

  const onGrabberMouseDown = (e, fieldName) => {
    setSelectionData((prev) => ({
      ...prev,
      fieldName,
      mode: "fill",
      // baseIndex: index,
      grabberIndex: index,
      lastIndex: index,
    }));
  };

  const handleUnitInfoChange = (variantIndexes, newValue = {}) => {
    const unitValues = {
      total_unit: variants[selectionData.baseIndex]?.total_unit,
      base_unit: variants[selectionData.baseIndex]?.base_unit,
      total_unit_amount: variants[selectionData.baseIndex]?.total_unit_amount,
      base_unit_amount: variants[selectionData.baseIndex]?.base_unit_amount,
      ...newValue,
    };
    dispatch(
      updateBulkVariants({
        key: "base_price_per_unit",
        value: unitValues,
        variant_index: variantIndexes,
      })
    );
  };

  const isMaxIndex = (index) => {
    const max = Math.max(selectionData?.baseIndex, selectionData?.end);
    if (index === max) return true;
    return false;
  };

  const handleMediaChange = (img, fieldName) => {
    delete img?.date;
    delete img?.modified;
    dispatch(
      updateBulkVariants({
        key: fieldName,
        value: img,
        variant_index: [index],
      })
    );
  };

  return (
    <TableRow
      key={currentVariation.id}
      style={{ cursor: isDragging ? "crosshair" : "default" }}
    >
      <TableCell
        style={{ minWidth: "260px", paddingRight: "12px" }}
        className={`${CLASS_PREFIX}-sticky-cell`}
      >
        <Flex gap={12} style={{ alignItems: "center" }}>
          <ThumbnailSelector
            src={currentVariation?.media?.url}
            onChange={(img) => handleMediaChange(img, "media")}
            size="small"
          />
          <span>
            <span style={{ color: "#878593" }}>
              {`${currentVariation?.name} - `}
              {varTitle.join(" - ")}
            </span>
          </span>
        </Flex>
      </TableCell>
      {selectedFields.includes("price") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "price")}
          onMouseEnter={(e) => onCellMouseEnter(e, "price")}
          className={getActiveState("price")}
        >
          <Input
            value={currentVariation?.price}
            placeholder="--"
            onChange={(value) => handleOnChange(value, "price")}
            onEnter={() => setSelectionData(null)}
            invisible
            type="number"
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "price")}
          />
        </TableCell>
      )}
      {selectedFields.includes("sale_price") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "sale_price")}
          onMouseEnter={(e) => onCellMouseEnter(e, "sale_price")}
          className={getActiveState("sale_price")}
        >
          <Input
            value={currentVariation?.sale_price}
            onChange={(value) => handleOnChange(value, "sale_price")}
            onEnter={() => setSelectionData(null)}
            invisible
            type="number"
            placeholder="--"
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "sale_price")}
          />
        </TableCell>
      )}
      {selectedFields.includes("cost_of_goods") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "cost_of_goods")}
          onMouseEnter={(e) => onCellMouseEnter(e, "cost_of_goods")}
          className={getActiveState("cost_of_goods")}
        >
          <Input
            value={currentVariation?.cost_of_goods}
            onChange={(value) => handleOnChange(value, "cost_of_goods")}
            onEnter={() => setSelectionData(null)}
            invisible
            type="number"
            placeholder="--"
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "cost_of_goods")}
          />
        </TableCell>
      )}
      {selectedFields.includes("profit") && (
        <TableCell disabled>
          <Input
            state="disabled"
            value={calculateProfit("profit", currentVariation)}
            invisible
            placeholder="--"
          />
        </TableCell>
      )}
      {selectedFields.includes("margin") && (
        <TableCell disabled>
          <Input
            state="disabled"
            value={calculateProfit("margin", currentVariation)}
            invisible
            placeholder="--"
          />
        </TableCell>
      )}
      {selectedFields.includes("show_unit_price") && (
        <TableCell
          alignment="center"
          onMouseDown={(e) => onCellMouseDown(e, "show_unit_price")}
          onMouseEnter={(e) => onCellMouseEnter(e, "show_unit_price")}
          className={getActiveState("show_unit_price")}
        >
          <Checkbox
            value={currentVariation?.show_unit_price}
            onChange={(value) => handleOnChange(value, "show_unit_price")}
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "show_unit_price")}
          />
        </TableCell>
      )}
      {selectedFields.includes("base_price_per_unit") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "base_price_per_unit")}
          onMouseEnter={(e) => onCellMouseEnter(e, "base_price_per_unit")}
          className={getActiveState("base_price_per_unit")}
        >
          {currentVariation?.show_unit_price ? (
            <BaseUnitPopup
              buttonProps={{ type: "invisible" }}
              index={index}
              onChange={(value) => handleOnChange(value, "base_price_per_unit")}
              data={currentVariation}
            />
          ) : (
            <span style={{ marginLeft: "12px" }}>_</span>
          )}
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "base_price_per_unit")}
          />
        </TableCell>
      )}
      {selectedFields.includes("sku") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "sku")}
          onMouseEnter={(e) => onCellMouseEnter(e, "sku")}
          className={getActiveState("sku")}
        >
          <Input
            value={currentVariation?.sku}
            invisible
            placeholder="--"
            // onChange={(value) => handleOnChange(value, "sku")}
            // onEnter={() => setSelectionData(null)}
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "sku")}
          />
        </TableCell>
      )}
      {selectedFields.includes("shipping_box_id") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "shipping_box_id")}
          onMouseEnter={(e) => onCellMouseEnter(e, "shipping_box_id")}
          className={getActiveState("shipping_box_id")}
          style={{ minWidth: "300px" }}
        >
          <ShippingBox
            value={currentVariation?.shipping_box_id}
            onChange={(value, fieldName) => handleOnChange(value, fieldName)}
            invisible
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "shipping_box_id")}
          />
        </TableCell>
      )}
      {selectedFields.includes("weight") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "weight")}
          onMouseEnter={(e) => onCellMouseEnter(e, "weight")}
          className={getActiveState("weight")}
        >
          <Input
            value={currentVariation?.weight}
            onChange={(value) => {
              handleOnChange(value, "weight");
            }}
            invisible
            placeholder="--"
            type="number"
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "weight")}
          />
        </TableCell>
      )}
      {selectedFields.includes("weight_unit") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "weight_unit")}
          onMouseEnter={(e) => onCellMouseEnter(e, "weight_unit")}
          className={getActiveState("weight_unit")}
        >
          <Select
            value={currentVariation?.weight_unit}
            optionsArray={[
              { value: "kg", title: __("KG", "kirki-ecommerce"), fallback: true },
              { value: "g", title: __("G", "kirki-ecommerce") },
              { value: "lb", title: __("LB", "kirki-ecommerce") },
              { value: "oz", title: __("OZ", "kirki-ecommerce") },
            ]}
            onChange={(value) => {
              handleOnChange(value, "weight_unit");
            }}
            invisible
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "weight_unit")}
          />
        </TableCell>
      )}
      {selectedFields.includes("track_inventory") && (
        <TableCell
          alignment="center"
          onMouseDown={(e) => onCellMouseDown(e, "track_inventory")}
          onMouseEnter={(e) => onCellMouseEnter(e, "track_inventory")}
          className={getActiveState("track_inventory")}
        >
          <Checkbox
            value={currentVariation?.track_inventory}
            onChange={(value) => handleOnChange(value, "track_inventory")}
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "track_inventory")}
          />
        </TableCell>
      )}
      {selectedFields.includes("available_quantity") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "available_quantity")}
          onMouseEnter={(e) => onCellMouseEnter(e, "available_quantity")}
          className={getActiveState("available_quantity")}
        >
          {currentVariation?.track_inventory ? (
            <Input
              value={currentVariation?.available_quantity}
              onChange={(value) => handleOnChange(value, "available_quantity")}
              onEnter={() => setSelectionData(null)}
              invisible
              type="number"
            />
          ) : (
            <span style={{ marginLeft: "12px" }}>_</span>
          )}
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "available_quantity")}
          />
        </TableCell>
      )}
      {selectedFields.includes("committed_quantity") && (
        <TableCell disabled>
          {currentVariation?.track_inventory ? (
            <Input
              state="disabled"
              value={currentVariation?.committed_quantity || 0}
              invisible
            />
          ) : (
            <span style={{ marginLeft: "12px" }}>_</span>
          )}
        </TableCell>
      )}
      {selectedFields.includes("has_limit_per_order") && (
        <TableCell
          alignment="center"
          onMouseDown={(e) => onCellMouseDown(e, "has_limit_per_order")}
          onMouseEnter={(e) => onCellMouseEnter(e, "has_limit_per_order")}
          className={getActiveState("has_limit_per_order")}
        >
          <Checkbox
            value={currentVariation?.has_limit_per_order}
            onChange={(value) => handleOnChange(value, "has_limit_per_order")}
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "has_limit_per_order")}
          />
        </TableCell>
      )}
      {selectedFields.includes("max_per_order") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "max_per_order")}
          onMouseEnter={(e) => onCellMouseEnter(e, "max_per_order")}
          className={getActiveState("max_per_order")}
        >
          {currentVariation?.has_limit_per_order ? (
            <Input
              value={currentVariation?.max_per_order || 0}
              onChange={(value) => handleOnChange(value, "max_per_order")}
              onEnter={() => setSelectionData(null)}
              invisible
              type="number"
            />
          ) : (
            <span style={{ marginLeft: "12px" }}>_</span>
          )}

          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "max_per_order")}
          />
        </TableCell>
      )}
      {selectedFields.includes("is_visible") && (
        <TableCell
          alignment="center"
          onMouseDown={(e) => onCellMouseDown(e, "is_visible")}
          onMouseEnter={(e) => onCellMouseEnter(e, "is_visible")}
          className={getActiveState("is_visible")}
        >
          <Checkbox
            value={currentVariation?.is_visible}
            onChange={(value) => handleOnChange(value, "is_visible")}
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "is_visible")}
          />
        </TableCell>
      )}
      {selectedFields.includes("charge_taxes") && (
        <TableCell
          alignment="center"
          onMouseDown={(e) => onCellMouseDown(e, "charge_taxes")}
          onMouseEnter={(e) => onCellMouseEnter(e, "charge_taxes")}
          className={getActiveState("charge_taxes")}
        >
          <Checkbox
            value={currentVariation?.charge_taxes}
            onChange={(value) => handleOnChange(value, "charge_taxes")}
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "charge_taxes")}
          />
        </TableCell>
      )}
      {selectedFields.includes("tax_profile_id") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "tax_profile_id")}
          onMouseEnter={(e) => onCellMouseEnter(e, "tax_profile_id")}
          className={getActiveState("tax_profile_id")}
        >
          {currentVariation?.charge_taxes ? (
            <Select
              value={currentVariation?.tax_profile_id}
              onChange={(value) => handleOnChange(value, "tax_profile_id")}
              invisible
            />
          ) : (
            <span style={{ marginLeft: "12px" }}>_</span>
          )}
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "tax_profile_id")}
          />
        </TableCell>
      )}
      {selectedFields.includes("shipping_profile_id") && (
        <TableCell
          onMouseDown={(e) => onCellMouseDown(e, "shipping_profile_id")}
          onMouseEnter={(e) => onCellMouseEnter(e, "shipping_profile_id")}
          className={getActiveState("shipping_profile_id")}
        >
          <Select
            optionsArray={[
              { value: "1", title: __("Heavy Weight", "kirki-ecommerce") },
              { value: "2", title: __("Fragile", "kirki-ecommerce") },
              { value: "3", title: __("Perishable", "kirki-ecommerce") },
              { value: "4", title: __("Flammable", "kirki-ecommerce") },
            ]}
            value={currentVariation?.shipping_profile_id}
            onChange={(value) => handleOnChange(value, "shipping_profile_id")}
            invisible
          />
          <span
            className={isMaxIndex(index) ? `${CLASS_PREFIX}-grabber` : ""}
            onMouseDown={(e) => onGrabberMouseDown(e, "shipping_profile_id")}
          />
        </TableCell>
      )}
    </TableRow>
  );
};

export default SingleRow;
