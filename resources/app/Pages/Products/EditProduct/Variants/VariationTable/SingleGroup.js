import { MediaStack, ThumbnailSelector } from "@/components";
import {
  Button,
  Checkbox,
  Flex,
  Input,
  Select,
  TableCell,
  TableRow,
} from "@/molecules";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { __ } from "@/wpi18n";
import {
  generateVariantIndexById,
  generateVariantIndexes,
  getAttributeByValueId,
} from "../../../utils";
import { updateVariants } from "../../../../../store/productSlice";
import { ChevronDownIcon } from "@/Icons";
import { CLASS_PREFIX } from "@/conf";

const SingleGroup = ({
  parentId,
  selectedIndex,
  setSelectedIndex,
  expandVariation,
}) => {
  const dispatch = useDispatch();
  const { data: productData } = useSelector((state) => state.product);
  const attributes = productData?.attributes || [];
  const variants = productData?.variants || [];
  const [selectedCheckedIndex, setSelectedCheckedIndex] = useState([]);
  const [combinedData, setCombinedData] = useState({});

  const thisVariants = variants.filter((v) => {
    return v.attribute_values?.includes(parentId);
  });

  const [show, setShow] = useState(expandVariation);

  if (!thisVariants.length) {
    return null;
  }

  useEffect(() => {
    let minPrice = thisVariants[0]?.price;
    let maxPrice = thisVariants[0]?.price;
    let in_stock = thisVariants[0]?.in_stock;
    let available_quantity = 0;
    let mediaArray = [thisVariants[0]?.media];

    thisVariants.forEach((item) => {
      minPrice = Number(Math.min(minPrice, item?.price));
      maxPrice = Number(Math.max(maxPrice, item?.price));
      in_stock = item?.in_stock !== in_stock ? " " : in_stock;
      available_quantity += Number(item?.available_quantity);
      mediaArray =
        item?.media && mediaArray.length < 2
          ? [...mediaArray, item.media]
          : mediaArray;
    });
    setCombinedData((prev) => ({
      ...prev,
      price: minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`,
      in_stock: in_stock,
      available_quantity: available_quantity,
      media: mediaArray,
    }));
  }, [variants]);

  const thisAttribute = getAttributeByValueId(attributes, parentId);

  useEffect(() => {
    setShow(expandVariation);
  }, [expandVariation]);

  useEffect(() => {
    if (selectedIndex.length === 0) {
      setSelectedCheckedIndex([]);
    } else if (selectedIndex.length === variants.length) {
      setSelectedCheckedIndex([...Array(thisVariants.length).keys()]);
    }
  }, [selectedIndex]);

  const handleOnChildValueChange = (value, fieldName, variant) => {
    const indexList = getIndexArray(variant).filter(
      (index) => !selectedIndex.includes(index),
    );
    if (fieldName === "media") {
      delete value?.date;
      delete value?.modified;
    }

    dispatch(
      updateVariants({
        key: fieldName,
        value: value,
        variant_index: [...selectedIndex, ...indexList],
      }),
    );
  };

  const handleOnParentValueChange = (value, fieldName) => {
    const indexList = generateVariantIndexes(variants, [parentId]);
    if (fieldName === "media") {
      delete value?.date;
      delete value?.modified;
    }
    dispatch(
      updateVariants({
        key: fieldName,
        value: value,
        variant_index: [
          ...selectedIndex,
          ...indexList.filter((item) => !selectedIndex.includes(item)),
        ],
      }),
    );
    setSelectedCheckedIndex([]);
    setSelectedIndex([]);
  };

  const handleParentCheckboxClick = (value, attributeArray) => {
    setShow(true);
    const indexList = generateVariantIndexes(variants, attributeArray);
    if (value) {
      setSelectedIndex((prev) => [
        ...prev,
        ...indexList.filter((item) => !selectedIndex.includes(item)),
      ]);
      setSelectedCheckedIndex([...Array(thisVariants.length).keys()]);
    } else {
      const newList = selectedIndex.filter((item) => !indexList.includes(item));
      setSelectedIndex(newList);
      setSelectedCheckedIndex([]);
    }
  };

  const handleChildCheckboxClick = (value, variant, index) => {
    const indexList = getIndexArray(variant);
    if (value) {
      setSelectedIndex((prev) => [...prev, ...indexList]);
      setSelectedCheckedIndex((prev) => [...prev, index]);
    } else {
      const newList = selectedIndex.filter((item) => !indexList.includes(item));
      setSelectedIndex(newList);
      setSelectedCheckedIndex((prev) => prev.filter((item) => item !== index));
    }
  };

  const getIndexArray = (variant) => {
    let indexList = [];
    if (variant.id) {
      indexList = generateVariantIndexById(variants, variant?.id);
    } else {
      indexList = generateVariantIndexes(variants, variant?.attribute_values);
    }
    return indexList;
  };

  const hasVariation = thisVariants[0].attribute_values.filter(
    (item) => item !== parentId,
  ).length;

  return (
    <>
      <TableRow className={`${CLASS_PREFIX}-hover-parent`}>
        <TableCell onlyCheckbox>
          <Checkbox
            value={selectedCheckedIndex.length === thisVariants.length}
            onChange={(value) => handleParentCheckboxClick(value, [parentId])}
            isPartialChecked={
              selectedCheckedIndex.length &&
              selectedCheckedIndex.length < thisVariants.length
            }
          />
        </TableCell>
        <TableCell style={{ width: "242px" }}>
          <Flex gap={12} style={{ alignItems: "center" }}>
            {hasVariation ? (
              <MediaStack size="small" mediaArray={combinedData?.media} />
            ) : (
              <ThumbnailSelector
                src={combinedData?.media?.[0]?.url}
                onChange={(img) => handleOnParentValueChange(img, "media")}
                size="small"
              />
            )}
            <Flex direction={"column"} gap={4}>
              <div>{thisAttribute?.value ?? ""}</div>
              {thisVariants[0]?.attribute_values.length > 1 && (
                <div>
                  {thisVariants.length}{" "}
                  {thisVariants.length > 1
                    ? __("Variations", "kirki-ecommerce")
                    : __("Variation", "kirki-ecommerce")}
                </div>
              )}
            </Flex>
            <Button
              size="xsm"
              icon={<ChevronDownIcon />}
              type="ghost"
              className={`${thisVariants[0]?.attribute_values.length > 1 ? `${CLASS_PREFIX}-hover-visible` : `${CLASS_PREFIX}-visibility-hidden`}`}
              onClick={() => setShow(!show)}
              style={{
                transform: show ? "rotate(180deg)" : "",
              }}
            />
          </Flex>
        </TableCell>
        <TableCell style={{ width: "170px" }}>
          <Input
            placeholder={__("19.99", "kirki-ecommerce")}
            style={{ textAlign: "center" }}
            value={combinedData?.price || ""}
            onChange={(value) => handleOnParentValueChange(value, "price")}
            state={hasVariation ? "muted" : ""}
            type={!hasVariation ? "number" : "text"}
          />
        </TableCell>
        <TableCell style={{ width: "170px" }}>
          {!productData?.variants[0]?.track_inventory ? (
            <Select
              value={combinedData?.in_stock?.toString()}
              optionsArray={[
                { value: "true", title: __("In Stock", "kirki-ecommerce") },
                { value: "false", title: __("Out of Stock", "kirki-ecommerce") },
              ]}
              forceText="--"
              onChange={(value) => handleOnParentValueChange(value, "in_stock")}
              onClose={() => console.log("dropdown closed")}
            />
          ) : (
            <Input
              value={combinedData?.available_quantity}
              state={hasVariation ? "muted" : ""}
              type="number"
              style={{ textAlign: "center" }}
              onChange={(value) =>
                handleOnParentValueChange(value, "available_quantity")
              }
            />
          )}
        </TableCell>
      </TableRow>
      {show && hasVariation ? (
        <>
          {thisVariants.map((item, index) => (
            <TableRow key={index}>
              <TableCell></TableCell>
              <TableCell>
                <Flex gap={12} style={{ alignItems: "center" }}>
                  <Checkbox
                    value={selectedCheckedIndex.includes(index)}
                    onChange={(value) =>
                      handleChildCheckboxClick(value, item, index)
                    }
                  />
                  <ThumbnailSelector
                    src={item?.media?.url}
                    onChange={(img) =>
                      handleOnChildValueChange(img, "media", item)
                    }
                    size="small"
                  />
                  <div>
                    {item.attribute_values
                      .filter((v) => v !== parentId)
                      .map((v) => getAttributeByValueId(attributes, v)?.value ?? String(v))
                      .join(" | ")}
                  </div>
                </Flex>
              </TableCell>
              <TableCell>
                <Input
                  placeholder={__("19.99", "kirki-ecommerce")}
                  style={{ textAlign: "center" }}
                  value={item?.price || ""}
                  type="number"
                  onChange={(value) =>
                    handleOnChildValueChange(value, "price", item)
                  }
                />
              </TableCell>
              <TableCell>
                {!productData?.variants[0]?.track_inventory ? (
                  <Select
                    value={item?.in_stock.toString()}
                    optionsArray={[
                      { value: "true", title: __("In Stock", "kirki-ecommerce") },
                      { value: "false", title: __("Out of Stock", "kirki-ecommerce") },
                    ]}
                    onClose={() => console.log("dropdown closed")}
                    onChange={(value) =>
                      handleOnChildValueChange(value, "in_stock", item)
                    }
                  />
                ) : (
                  <Input
                    value={item?.available_quantity}
                    style={{ textAlign: "center" }}
                    type="number"
                    onChange={(value) =>
                      handleOnChildValueChange(
                        value,
                        "available_quantity",
                        item,
                      )
                    }
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </>
      ) : null}
    </>
  );
};

export default SingleGroup;
