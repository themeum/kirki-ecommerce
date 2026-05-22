import React, { useRef, useState } from "react";
import Button from '@/molecules/button';
import { Popover, PopoverBody, PopoverDescription, PopoverFooter, PopoverTitle } from '@/molecules/popover';

const AlertboxPreview = () => {
  const [openAlertbox, setOpenAlertbox] = useState(false);
  const toggleAlertboxOpen = () => {
    setOpenAlertbox((prev) => !prev);
  };
  const closeAlertbox = () => {
    setOpenAlertbox(false);
  };
  return (
    <div>
      <Button
        type="outlined"
        text="Alert Button"
        onClick={toggleAlertboxOpen}
      />
      <Popover isOpen={openAlertbox} onClose={closeAlertbox}>
        <PopoverBody>
          <PopoverTitle>Are you absolutely sure?</PopoverTitle>
          <PopoverDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers. Beware!
          </PopoverDescription>
        </PopoverBody>
        <PopoverFooter>
          <Button
            text="Cancel"
            type="outlined"
            onClick={() => {
              console.log("closed alert");
              closeAlertbox();
            }}
          />
          <Button
            text="OK"
            type="inverse"
            onClick={() => {
              console.log("action performed");
              closeAlertbox();
            }}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};

export default AlertboxPreview;
