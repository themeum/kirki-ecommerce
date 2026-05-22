import RadioGroup from '@/molecules/radio-group/radio-group';
import React from "react";

const RadioGroupPreview = () => {
  const optionsArray = [
    { value: "item-1", title: "Item 1" },
    { value: "item-2", title: "Item 2" },
    { value: "item-3", title: "Item 3" },
    { value: "item-4", title: "Item 4" },
  ];
  return (
    <div>
      <RadioGroup
        optionsArray={optionsArray}
        defaultValue="item-1"
        onChange={(value) => console.log(value)}
        type="checked"
      />
    </div>
  );
};

export default RadioGroupPreview;
