import React, { useState, forwardRef } from "react";
import { CLASS_PREFIX } from "@/conf";
import classNames from "classnames";
import Label from "../Label";
import Flex from "../Flex";
import { __ } from "@/wpi18n";
import { CloseIcon } from "@/Icons";

const Input = forwardRef((props, ref) => {
  const {
    id,
    value,
    type = "text",
    label,
    helpText,
    leftIcon,
    rightIcon,
    state,
    placeholder,
    className,
    style,
    onChange = () => {},
    onClick = () => {},
    onBlur = () => {},
    onFocus = () => {},
    onKeyDown = () => {},
    onKeyPress = () => {},
    onEnter = () => {},
    accept,
    multiple = false,
    multiline,
    step = 1,
    min = 0,
    max = 1000000000000,
    error,
    invisible,
    readOnly,
    leftSymbol,
    onClearInput,
    handleRightAction = () => {},
  } = props;

  const inputVariants = {
    default: `${CLASS_PREFIX}-input`,
    type: {
      text: `${CLASS_PREFIX}-text-input`,
      file: `${CLASS_PREFIX}-file-input`,
      number: `${CLASS_PREFIX}-number-input`,
    },
    state: {
      muted: `${CLASS_PREFIX}-input-muted`,
      disabled: `${CLASS_PREFIX}-input-disabled`,
      active: `${CLASS_PREFIX}-input-active`,
    },
    error: `${CLASS_PREFIX}-input-error`,
    invisible: `${CLASS_PREFIX}-input-invisible`,
  };

  const allClassNames = classNames(
    inputVariants.default,
    inputVariants.type[type],
    inputVariants.state[state],
    invisible && inputVariants.invisible,
    error && inputVariants.error,
    className,
  );

  const [fileName, setFileName] = useState(["No file chosen"]);
  const inputRef = ref;

  const focusHandler = () => {
    onFocus();
  };

  const onKeyDownHandler = (e) => {
    const { value } = e.target;
    e.stopPropagation();
    const isNumeric = type === "number" || isFinite(value);
    if (isNumeric) {
      const numericValue = parseFloat(value) || 0;
      const stepCount = e.shiftKey ? 10 : step;

      if (e.key === "ArrowUp" || e.keyCode === 38) {
        e.preventDefault();
        const newValue = Math.min(numericValue + stepCount, max);
        e.target.value = newValue;
        onChange?.(newValue);
      }

      if (e.key === "ArrowDown" || e.keyCode === 40) {
        e.preventDefault();
        const newValue = Math.max(numericValue - stepCount, min);
        e.target.value = newValue;
        onChange?.(newValue);
      }
    }
    if (e.which === 13 || e.keyCode === 13) {
      e.preventDefault();
      e.currentTarget.blur();

      if (value > max) {
        e.target.value = max;
      } else if (value < min) {
        e.target.value = min;
      }

      onEnter(e.target.value);
    }
    onKeyDown(e.target.value);
  };

  const onKeyPressHandler = (e) => {
    e.stopPropagation();
    onKeyPress(e.target.value);
  };

  const handleInputChange = (e) => {
    if (type === "file") {
      const fileList = Array.from(e.target.files || []);
      setFileName((prev) =>
        fileList.length > 1
          ? `${fileList.length} files chosen`
          : fileList?.[0]?.name || prev,
      );
    } else {
      const { value } = e.target;
      if (type === "number") {
        onChange(parseFloat(value));
      } else onChange(value);
    }
  };

  const handleInputClick = (e) => {
    const { value } = e.target;
    if (onClick) onClick(value);
  };
  const handleInputBlur = (e) => {
    const { value } = e.target;

    if (value > max) {
      e.target.value = max;
    } else if (value < min) {
      e.target.value = min;
    }

    if (onBlur) onBlur(e.target.value);
  };

  const handleOnClearInput = () => {
    if (onClearInput) onClearInput();
  };
  const inputHasIcon = leftIcon || leftSymbol || rightIcon || onClearInput;

  const inputActionProps = {
    onClick: handleInputClick,
    onBlur: handleInputBlur,
    onFocus: focusHandler,
    onChange: handleInputChange,
    onKeyDown: onKeyDownHandler,
    onKeyPress: onKeyPressHandler,
  };

  return (
    <div className={`${CLASS_PREFIX}-input-wrapper`}>
      {type === "file" ? (
        <Flex direction="column" gap={8}>
          {label && (
            <Label
              text={label}
              type={error ? "error" : ""}
              helpText={error ? error : helpText}
            />
          )}
          <span className={allClassNames} style={style}>
            <label>
              <input
                id={id}
                ref={inputRef}
                type="file"
                onChange={handleInputChange}
                hidden
                accept={accept}
                multiple={multiple}
              />
              <span className={`${CLASS_PREFIX}-input-file-upload-btn`}>
                {__("Choose file", "kirki-ecommerce")}
              </span>
            </label>
            <span className={`${CLASS_PREFIX}-filename-placeholder`}>
              {fileName}
            </span>
          </span>
        </Flex>
      ) : (
        <div className={`${CLASS_PREFIX}-input-controller`}>
          {label && (
            <Label
              text={label}
              type={error ? "error" : ""}
              helpText={error ? error : helpText}
            />
          )}

          {multiline ? (
            <textarea
              id={id}
              ref={inputRef}
              onChange={handleInputChange}
              className={`${CLASS_PREFIX}-textarea ${allClassNames}`}
              style={style}
              value={value}
              placeholder={placeholder}
              rows={multiline ? 5 : 1}
            />
          ) : (
            <div
              className={`${
                inputHasIcon ? `${CLASS_PREFIX}-input-has-icon` : ""
              } ${leftSymbol ? `${CLASS_PREFIX}-input-has-left-symbol` : ""} ${
                leftIcon ? `${CLASS_PREFIX}-input-has-left-icon` : ""
              } ${
                rightIcon || onClearInput
                  ? `${CLASS_PREFIX}-input-has-right-icon`
                  : ""
              }`}
            >
              {(leftIcon || leftSymbol) && (
                <span className={`${CLASS_PREFIX}-input-left-icon`}>
                  {leftIcon || leftSymbol}
                </span>
              )}
              <input
                id={id}
                ref={inputRef}
                type={type}
                min={min}
                max={max}
                {...inputActionProps}
                className={allClassNames}
                style={style}
                value={value}
                placeholder={placeholder}
                readOnly={readOnly}
              />
              {rightIcon && (
                <span
                  className={`${CLASS_PREFIX}-input-right-icon`}
                  onClick={handleRightAction}
                >
                  {rightIcon}
                </span>
              )}
              {onClearInput && (
                <span
                  className={`${CLASS_PREFIX}-input-right-icon`}
                  onClick={handleOnClearInput}
                >
                  <CloseIcon />
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default Input;
