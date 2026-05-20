import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverHeader,
  PopoverBody,
  Input,
  Select,
  Button,
  PopoverFooter,
} from "../../../../../molecules";
import { __ } from "wpi18n";

const VatCollectionPopup = (props) => {
  const {
    openPopup,
    setOpenPopup,
    statesOption,
    onAdd,
    editIndex,
    setEditIndex,
    vatCollectionList,
  } = props;

  const [vatItem, setVatItem] = useState({
    state: "",
    rate: "",
    flag: "",
  });

  useEffect(() => {
    if (typeof editIndex === "number" && vatCollectionList?.[editIndex]) {
      const item = vatCollectionList[editIndex];

      setVatItem({
        state: item.state,
        rate: item.rate,
        flag: item.flag || "",
      });
    } else {
      setVatItem({ state: "", rate: "", flag: "" });
    }
  }, [editIndex, vatCollectionList, openPopup]);

  const handleOnChange = (value, key) => {
    setVatItem((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const buttonState = vatItem?.state === "" || vatItem?.rate === "";

  return (
    <Popover isOpen={openPopup} style={{ width: "400px" }}>
      <PopoverHeader
        style={{ padding: "var(--decom-spacing-5)" }}
        onClose={() => {
          setOpenPopup(false);
          setEditIndex(null);
        }}
      >
        {__("Collect VAT", "kirki-ecommerce")}
      </PopoverHeader>

      <PopoverBody
        style={{
          padding:
            "var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)",
          gap: "var(--decom-spacing-4)",
        }}
      >
        <Select
          label={__("Select country", "kirki-ecommerce")}
          optionsArray={statesOption}
          value={vatItem.state}
          onChange={(value) => handleOnChange(value, "state")}
        />

        <Input
          label={__("VAT (%)", "kirki-ecommerce")}
          placeholder="e.g. 20%"
          value={vatItem.rate}
          onChange={(value) => handleOnChange(value, "rate")}
        />
      </PopoverBody>
      <PopoverFooter>
        <Button
          type="outlined"
          text={__("Cancel", "kirki-ecommerce")}
          size="small"
          onClick={() => {
            setOpenPopup(false);
            setEditIndex(null);
          }}
        />
        <Button
          type="primary"
          text={
            typeof editIndex === "number"
              ? __("Update", "kirki-ecommerce")
              : __("Done", "kirki-ecommerce")
          }
          size="small"
          onClick={() => {
            onAdd(vatItem, editIndex);
            setOpenPopup(false);
          }}
          state={buttonState ? "disabled" : "default"}
        />
      </PopoverFooter>
    </Popover>
  );
};

export default VatCollectionPopup;
