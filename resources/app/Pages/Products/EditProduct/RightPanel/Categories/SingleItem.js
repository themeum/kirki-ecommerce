import { Checkbox } from "@/molecules";
import React from "react";

const SingleItem = ({ category, selectedCategories, onSelectCategory }) => {
  return (
    <div style={{ padding: "8px 16px 8px 0px" }}>
      <Checkbox
        label={category.name}
        value={selectedCategories.some((c) => c.id === category.id)}
        onChange={(value) => onSelectCategory(value)}
      />
    </div>
  );
};

export default SingleItem;
