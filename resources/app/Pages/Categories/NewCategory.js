import { Button } from "@/molecules";
import React from "react";
import { useState } from "react";
import CategoryAddEditPopover from "./CategoryAddEditPopover";
import { __ } from "@/wpi18n";

const initialState = {
  name: "",
  slug: "",
  parent_id: null,
  description: "",
  image: null,
};
const NewCategory = () => {
  const [openPopup, setOpenPopup] = useState(false);
  return (
    <>
      <Button
        type="primary"
        text={__("New Category", "kirki-ecommerce")}
        size="small"
        onClick={() => setOpenPopup(true)}
      />

      {openPopup && (
        <CategoryAddEditPopover
          category={initialState}
          onClose={() => setOpenPopup(false)}
        />
      )}
    </>
  );
};

export default NewCategory;
