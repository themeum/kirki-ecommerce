import React from "react";
import Select from '@/molecules/select/select';
import { CLASS_PREFIX } from "@/conf";
import { MinusIcon } from "@/icons";
import Button from '@/molecules/button';
import { useRef } from "react";

const Capsule = (props) => {
  const {
    optionsArray,
    value,
    onClearItem = () => {},
    onValueChange = () => [],
    hasDropdown = true,
    uniqueKey,
    multiple,
  } = props;
  const triggerRef = useRef(null);
  return (
    <div className={`${CLASS_PREFIX}-capsule`} ref={triggerRef} key={uniqueKey}>
      <Select
        invisible
        optionsArray={optionsArray}
        value={value}
        onChange={onValueChange}
        anchorRef={triggerRef}
        hasDropdown={hasDropdown}
        multiple={multiple}
      />
      <div className={`${CLASS_PREFIX}-separator`}></div>
      <Button
        type="invisible"
        size="small"
        icon={<MinusIcon />}
        onClick={onClearItem}
      />
    </div>
  );
};

export default Capsule;
