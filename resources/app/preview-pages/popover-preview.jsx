import React, { useRef, useState } from "react";
import Button from '@/molecules/button';
import Popover from '@/molecules/popover/popover';
import PopoverBody from '@/molecules/popover/popover-body';
import PopoverFooter from '@/molecules/popover/popover-footer';
import PopoverHeader from '@/molecules/popover/popover-header';

const PopoverPreview = () => {
  const [openPopover, setOpenPopover] = useState(false);
  return (
    <div>
      <Button
        type="outlined"
        text="Click"
        onClick={() => setOpenPopover(true)}
      />
      <Popover isOpen={openPopover} onClose={() => setOpenPopover(false)}>
        <PopoverHeader onClose={() => setOpenPopover(false)}>
          This is Header
        </PopoverHeader>
        <PopoverBody>
          This is popover body. Contains the description
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text="Close"
            onClick={() => setOpenPopover(false)}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};

export default PopoverPreview;
