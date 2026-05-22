import React from "react";
import Input from '@/molecules/input';
import { CLASS_PREFIX } from "@/conf";
import SuggestionDropdown from '@/molecules/suggestion-dropdown';
import { useState, useRef, useEffect } from "react";
import { __ } from "@/wpi18n";
import { forwardRef } from "react";
import { PlusCircleIcon, SearchIcon } from "@/icons";
import Separator from '@/molecules/separator';

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const Searchbox = forwardRef((props, ref) => {
  const {
    value,
    onChange = () => {},
    onClick = () => {},
    onEnter = () => {},
    onBlur = () => {},
    onOptionClick = () => {},
    style = {},
    suggestionArray = [],
    className = "",
    label,
    helpText,
    placeholder = __("Search", "kirki-ecommerce"),
    leftIcon,
    rightIcon,
    hasIcon = true,
    hasAddBtn = false,
    btnText = "Add",
    onNewOptionAdd = () => {},
    state,
    error,
    readOnly,
    onClearInput,
  } = props;
  const triggerRef = ref || useRef(null);
  const [openSuggestionDropdown, setOpenSuggestionDropDown] = useState(false);
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const debouncedOnChange = useRef(debounce(onChange, 300)).current;
  const handleSearchChange = (value) => {
    setSearchValue(value);
    debouncedOnChange(value);
  };
  const handleOptionClick = (option) => {
    setOpenSuggestionDropDown(false);
    onOptionClick(option);
  };

  return (
    <>
      <Input
        type={searchValue ? "text" : "search"}
        label={label}
        helpText={helpText}
        ref={triggerRef}
        onChange={handleSearchChange}
        onBlur={onBlur}
        value={searchValue}
        placeholder={placeholder}
        onClick={() => {
          setOpenSuggestionDropDown(true);
          onClick();
        }}
        onEnter={(value) => {
          setOpenSuggestionDropDown(false);
          onEnter(value);
        }}
        leftIcon={leftIcon ? leftIcon : !hasIcon ? null : <SearchIcon />}
        rightIcon={rightIcon}
        className={className}
        style={style}
        state={state}
        error={error}
        readOnly={readOnly}
        onClearInput={onClearInput}
      />
      {(suggestionArray.length > 0 || hasAddBtn) && (
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
                  onNewOptionAdd(triggerRef.current.value);
                  setOpenSuggestionDropDown();
                }}
              >
                <span className={`${CLASS_PREFIX}-select-icon`}>
                  <PlusCircleIcon />
                </span>
                <span>{btnText}</span>
              </div>
              {suggestionArray.length > 0 && <Separator />}
            </>
          )}
          {suggestionArray.map((option, index) => (
            // <div key={index}>{option.title}</div>
            <div
              className={`${CLASS_PREFIX}-select-item`}
              key={index}
              onClick={() => handleOptionClick(option)}
            >
              {option.leftIcon && (
                <div className={`${CLASS_PREFIX}-select-icon`}>
                  {option.leftIcon}
                </div>
              )}
              <div className={`${CLASS_PREFIX}-select-text-wrapper`}>
                {option.title}
              </div>
            </div>
          ))}
        </SuggestionDropdown>
      )}
    </>
  );
});

export default Searchbox;
