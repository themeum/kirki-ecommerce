import React, { useState, useEffect } from "react";
import { CLASS_PREFIX } from "conf";
import Label from "../Label";
import Flex from "../Flex";

const ColorPicker = (props) => {
  const { value, onChange, label, error, placeholder, helpText } = props;
  const [inputValue, setInputValue] = useState(value || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const validateInputColor = (value) => {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
  };

  const handleChange = (val) => {
    setInputValue(val);

    if (validateInputColor(val)) {
      onChange?.(val);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (validateInputColor(inputValue)) {
        onChange?.(inputValue);
      }
    }
  };

  return (
    <Flex direction={"column"} gap={8}>
      {label && (
        <Label
          text={label}
          type={error ? "error" : ""}
          helpText={error ? error : helpText}
        />
      )}
      <div className={`${CLASS_PREFIX}-color-picker-wrapper`}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
          }}
        >
          <div
            style={{
              backgroundColor: inputValue || placeholder,
              height: "16px",
              width: "16px",
              border: "1px solid #E6E6E6",
              borderRadius: "50%",
            }}
            onClick={() => setOpen(!open)}
          />

          <input
            type="text"
            // maxLength={7}
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${CLASS_PREFIX}-color-picker-input`}
            placeholder={placeholder}
          />
        </div>

        {/* {open && <div>{"color picker opened"}</div>} */}
      </div>
    </Flex>
  );
};
export default ColorPicker;
