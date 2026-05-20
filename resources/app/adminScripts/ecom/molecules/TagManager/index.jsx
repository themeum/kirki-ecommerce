import React, { useState, useEffect, useRef } from "react";
import SelectedTags from "./SelectedTags";
import Tag from "../Tag";
import SuggestionDropdown from "../SuggestionDropdown";
import { MinusIcon, PlusCircleIcon, TrashIcon } from "icons";
import Separator from "../Separator";
import { CLASS_PREFIX } from "conf";
import Label from "../Label";
import Flex from "../Flex";
import Searchbox from "../Searchbox";
import Text from "../Text";
import ActionGroup from "../ActionGroup";
import Button from "../Button";
import { __ } from "wpi18n";

const TagManager = (props) => {
  const {
    showInputField = true,
    selectedTags = [],
    suggestions = [],
    label,
    value,
    searchKey,
    helpText,
    placeholder = __("Type to add tags..", "kirki-ecommerce"),
    onTagAdd = () => {},
    onNewTagAdd = () => {},
    onTagRemove = () => {},
    onSearchChange = () => {},
    onClick = () => {},
    onBlur = () => {},
    className = "",
    style = {},
    type = "default",
    leftIcon,
    hasSearchIcon,
    error,
    btnText = __("Add Tag", "kirki-ecommerce"),
    hasAddBtn = true,
    showSuggestionDropdown = true,
    readOnly = false,
    showRemoveIcon = true,
  } = props;

  const [openSuggestionDropdown, setOpenSuggestionDropDown] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const triggerRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleOptionClick = (tag) => {
    onTagAdd(tag);
    setInputValue("");
    setOpenSuggestionDropDown(false);
  };

  const handleOnEnterPress = (tagTitle) => {
    onNewTagAdd(tagTitle);
    handleSearchChange("");
    setOpenSuggestionDropDown(false);
  };

  const handleNewTagAdd = (title) => {
    onNewTagAdd(title);
    handleSearchChange("");
    setOpenSuggestionDropDown(false);
  };

  const handleSearchChange = (value) => {
    setInputValue(value);
    onSearchChange(value);
  };

  return (
    <Flex direction="column" gap={8}>
      {label && (
        <Label
          text={label}
          type={error ? "error" : ""}
          helpText={error ? error : helpText}
        />
      )}
      <div
        className={`${CLASS_PREFIX}-tag-manager ${
          type === "list" ? `${CLASS_PREFIX}-tag-manager-list` : ""
        } ${className}`}
        style={style}
      >
        {showInputField && (
          <>
            {type === "default" && (
              <Searchbox
                ref={triggerRef}
                key={searchKey}
                value={inputValue}
                placeholder={placeholder}
                className={`${CLASS_PREFIX}-tag-manager-input ${selectedTags.length > 0 ? `${CLASS_PREFIX}-border-none` : ""}`}
                onChange={(value) => handleSearchChange(value)}
                onBlur={onBlur}
                onEnter={(title) => handleOnEnterPress(title)}
                onClick={() => {
                  setOpenSuggestionDropDown(
                    hasAddBtn || suggestions.length > 0,
                  );
                  onClick();
                }}
                leftIcon={leftIcon}
                hasIcon={hasSearchIcon}
                readOnly={readOnly}
              />
            )}
            {showSuggestionDropdown && (
              <SuggestionDropdown
                isOpen={openSuggestionDropdown}
                triggerRef={triggerRef}
                setIsOpen={setOpenSuggestionDropDown}
                onClose={() => setOpenSuggestionDropDown(false)}
              >
                {hasAddBtn && (
                  <>
                    <div
                      className={`${CLASS_PREFIX}-select-item`}
                      onClick={() => {
                        handleNewTagAdd(triggerRef.current.value);
                      }}
                    >
                      <span className={`${CLASS_PREFIX}-select-icon`}>
                        <PlusCircleIcon />
                      </span>
                      <span>{btnText}</span>
                    </div>
                    {suggestions.length > 0 && <Separator />}
                  </>
                )}
                {suggestions.map((option, key) => (
                  <div
                    className={`${CLASS_PREFIX}-select-item`}
                    key={key}
                    onClick={() => handleOptionClick(option)}
                  >
                    {option?.leftIcon && (
                      <div className={`${CLASS_PREFIX}-select-icon`}>
                        {option.leftIcon}
                      </div>
                    )}
                    {option?.color && (
                      <div
                        className={`${CLASS_PREFIX}-color-swatch`}
                        style={{ background: option?.color }}
                      />
                    )}
                    <div className={`${CLASS_PREFIX}-select-text-wrapper`}>
                      {option.title}
                    </div>
                  </div>
                ))}
              </SuggestionDropdown>
            )}
          </>
        )}
        {type === "list" ? (
          <Flex direction="column">
            {selectedTags.map((item, index) => (
              <div key={index}>
                <Flex style={{ alignItems: "center", padding: "12px" }} gap={8}>
                  {item?.color && (
                    <div
                      style={{
                        height: "16px",
                        width: "16px",
                        borderRadius: "50%",
                        background: item?.color,
                      }}
                    />
                  )}
                  <Text
                    header={item.title}
                    type="xsm"
                    style={{ fontWeight: "500" }}
                  />
                  <ActionGroup>
                    <Button
                      size="xsm"
                      type="outlined"
                      icon={<TrashIcon />}
                      onClick={() => onTagRemove(item)}
                    />
                  </ActionGroup>
                </Flex>
                <Separator style={{ margin: "0" }} />
              </div>
            ))}
            {showInputField && (
              <Searchbox
                ref={triggerRef}
                value={inputValue}
                key={searchKey}
                placeholder={placeholder}
                onBlur={onBlur}
                className={`${CLASS_PREFIX}-tag-manager-input`}
                onChange={(value) => handleSearchChange(value)}
                onEnter={(title) => handleOnEnterPress(title)}
                onClick={() => {
                  setOpenSuggestionDropDown(true);
                  onClick();
                }}
                leftIcon={leftIcon}
              />
            )}
          </Flex>
        ) : (
          <>
            {selectedTags.length > 0 ? (
              <SelectedTags
                className={
                  !showInputField ? `${CLASS_PREFIX}-has-border-radius` : ""
                }
              >
                {selectedTags.map((tag, index) => (
                  <Tag
                    text={tag.title}
                    img={tag.tagIcon}
                    subText={tag?.subText}
                    key={index}
                    onTagRemove={() => onTagRemove(tag)}
                    closeIcon={showRemoveIcon && <MinusIcon />}
                    color={tag?.color}
                  />
                ))}
              </SelectedTags>
            ) : null}
          </>
        )}
      </div>
    </Flex>
  );
};

export default TagManager;
