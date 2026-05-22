import React from "react";
import ColorPicker from '@/molecules/color-picker'

const ColorPickerPreview = () => {
  return (
    <div>
      <ColorPicker
        value={"#1a6cbe"}
        onChange={(value) => console.log(value)}
        label={"Set Color"}
      />
    </div>
  );
};

export default ColorPickerPreview;
