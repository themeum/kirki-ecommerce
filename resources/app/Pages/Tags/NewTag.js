import { Button } from "@/molecules";
import React from "react";
import { useState } from "react";
import TagAddEditPopover from "./TagAddEditPopover";
import { __ } from "@/wpi18n";

const initialState = {
  name: "",
  slug: "",
  parent_id: null,
  description: "",
  image: null,
};
const NewTag = () => {
  const [openPopup, setOpenPopup] = useState(false);
  return (
    <>
      <Button
        type="primary"
        text={__("New Tag", "kirki-ecommerce")}
        size="small"
        onClick={() => setOpenPopup(true)}
      />

      {openPopup && (
        <TagAddEditPopover
          tag={initialState}
          onClose={() => setOpenPopup(false)}
        />
      )}
    </>
  );
};

export default NewTag;
