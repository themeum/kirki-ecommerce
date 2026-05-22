import React, { useState } from "react";

import { ButtonDefaultIcon } from "@/icons";
import { Select } from '@/molecules/select';

const SelectPreview = () => {
  const optionsArray = [
    {
      value: "fruit-1",
      title: "Fruit 1 blablablablabalblaBLAblablabla",
    },
    { value: "fruit-2", title: "Fruit 2" },
    { value: "fruit-3", title: "Fruit 3" },
    { value: "fruit-4", title: "Fruit 4" },
    { value: "fruit-5", title: "Fruit 5" },
    { value: "fruit-6", title: "Fruit 6" },
    { value: "fruit-7", title: "Fruit 7" },
    { value: "fruit-8", title: "Fruit 8" },
    { value: "fruit-9", title: "Fruit 9" },
    { value: "fruit-10", title: "Fruit 10" },
    { value: "fruit-11", title: "Fruit 11" },
    { value: "fruit-12", title: "Fruit 12" },
    { value: "fruit-13", title: "Fruit 13" },
    { value: "fruit-14", title: "Fruit 14" },
    { value: "fruit-15", title: "Fruit 15" },
  ];
  const [value, setValue] = useState(null);
  const handleSelectValueChange = (newValue) => {
    console.log(newValue);
    setValue(newValue);
  };
  return (
    <>
      <div style={{ width: "200px" }}>
        <Select
          label="Select dropdown 1"
          placeholder="Select"
          optionsArray={optionsArray}
          onChange={(value) => handleSelectValueChange(value)}
          onClose={() => console.log("dropdown closed")}
          multiple
        />
      </div>
      <div>
        <Select
          label="Select dropdown 2"
          value={value}
          optionsArray={optionsArray}
          onChange={(value) => handleSelectValueChange(value)}
          onClose={() => console.log("dropdown closed")}
        />
      </div>
    </>
  );
};

export default SelectPreview;
