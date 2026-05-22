import { TagManager } from "@/molecules";
import React from "react";
import { useState } from "react";

const TagManagerPreview = () => {
  const initialSelectedTags = [
    { value: "11", title: "embroidered" },
    { value: "12", title: "manufactured" },
    { value: "13", title: "best-selling" },
    { value: "15", title: "winter sale" },
    { value: "16", title: "Product name" },
    { value: "17", title: "Product description" },
    { value: "18", title: "Brand" },
    { value: "19", title: "Image" },
    { value: "20", title: "Regular Price" },
  ];
  const initialSuggestionsArray = [
    { value: "1", title: "Sale Price" },
    { value: "2", title: "Inventory" },
    { value: "3", title: "Identification Properties" },
    { value: "4", title: "Rating Value" },
    { value: "5", title: "No of Ratings" },
    { value: "6", title: "Best Rating" },
    { value: "7", title: "Review" },
    { value: "8", title: "yellow" },
    { value: "9", title: "half-sleeve" },
    { value: "10", title: "cotton" },
  ];
  const [selectedTags, setSelectedTags] = useState(initialSelectedTags);
  const [suggestionsArray, setSuggestionArray] = useState(
    initialSuggestionsArray
  );

  const handleAddTag = (tag) => {
    const updatedSuggestionArray = suggestionsArray.filter(
      (item) => item.value !== tag.value
    );
    const updatedSelectedTags = [tag, ...selectedTags];
    setSelectedTags(updatedSelectedTags);
    setSuggestionArray(updatedSuggestionArray);
    console.log(tag, updatedSelectedTags, updatedSuggestionArray, "added");
  };

  const handleTagRemove = (tag) => {
    const updatedSelectedTags = selectedTags.filter(
      (item) => item.value !== tag.value
    );
    const updatedSuggestionArray = [tag, ...suggestionsArray];
    setSelectedTags(updatedSelectedTags);
    setSuggestionArray(updatedSuggestionArray);
    console.log(tag, updatedSelectedTags, updatedSuggestionArray, "removed");
  };

  const handleAddNewTag = (tagTitle) => {
    console.log(tagTitle, "new tag added");
  };

  const handleSearchChange = (searchText) => {
    console.log(searchText, "search update");
  };

  return (
    <div>
      <TagManager
        label="Tags"
        helpText="Choose the related tags"
        selectedTags={selectedTags}
        placeholder="Type to add tags.."
        suggestions={suggestionsArray}
        onTagAdd={(tag) => {
          handleAddTag(tag);
        }}
        onTagRemove={(tag) => {
          handleTagRemove(tag);
        }}
        onNewTagAdd={(tagTitle) => {
          handleAddNewTag(tagTitle);
        }}
        onSearchChange={(searchText) => {
          handleSearchChange(searchText);
        }}
      />
    </div>
  );
};

export default TagManagerPreview;
