import React from "react";
import { Tab } from "molecules";
import { AlignLeftIcon } from "icons";

const TabPreview = () => {
  return (
    <>
      <Tab activeIndex={0} onChange={(index) => console.log(index)}>
        <div>Search Engines</div>
        <div>Social Share</div>
        <div>Schema</div>
      </Tab>
      <Tab activeIndex={1}>
        <AlignLeftIcon />
        <AlignLeftIcon />
        <AlignLeftIcon />
      </Tab>
    </>
  );
};

export default TabPreview;
