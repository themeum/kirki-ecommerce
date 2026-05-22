import React from "react";
import { Checkbox } from "@/molecules";

const CheckboxPreview = () => {
  return (
    <>
      <Checkbox
        value={true}
        label="Value 1"
        onChange={(value) => console.log(value, "checkbox 1")}
      />
      <Checkbox
        value={false}
        label="Value 2"
        onChange={(value) => console.log(value, "checkbox 2")}
      />
    </>
  );
};

export default CheckboxPreview;
