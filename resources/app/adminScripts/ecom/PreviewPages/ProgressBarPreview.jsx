import React, { useState } from "react";
import ProgressBar from "../molecules/Progressbar";

const ProgressBarPreview = () => {
  const [value, setValue] = useState(46);
  const handleProgress = (value) => {
    setValue(value);
  };
  return (
    <div>
      <ProgressBar
        value={value}
        onChange={handleProgress}
        label={"Progress Bar"}
        rightText={value}
      />
    </div>
  );
};

export default ProgressBarPreview;
