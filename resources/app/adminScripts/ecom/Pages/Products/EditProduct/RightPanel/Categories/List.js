import React from "react";
import SingleItem from "./SingleItem";

const List = ({
  categories,
  parent_id,
  selectedCategories,
  onSelectCategory,
}) => {
  const data = categories.filter(
    (category) => category.parent_id === parent_id,
  );
  const handleParentCategorySelect = (value, category) => {
    onSelectCategory(value, category);
  };
  return (
    <div>
      {data.map((category) => (
        <React.Fragment key={category.id}>
          <SingleItem
            category={category}
            selectedCategories={selectedCategories}
            onSelectCategory={(v) => handleParentCategorySelect(v, category)}
          />
          <div style={{ paddingLeft: "16px" }}>
            <List
              categories={categories}
              parent_id={category.id}
              selectedCategories={selectedCategories}
              onSelectCategory={onSelectCategory}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default List;
