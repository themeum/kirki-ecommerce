import { useState } from 'react';

import Button from '@/molecules/button';
import { Popover, PopoverBody, PopoverFooter, PopoverHeader } from '@/molecules/popover';

const PopoverPreview = () => {
  const [openPopover, setOpenPopover] = useState(false);

  const handleOpenPopover = () => {
    setOpenPopover(true);
  };

  const handleClosePopover = () => {
    setOpenPopover(false);
  };

  return (
    <div>
      <Button type="outlined" text="Click" onClick={handleOpenPopover} />
      <Popover isOpen={openPopover} onClose={handleClosePopover}>
        <PopoverHeader onClose={handleClosePopover}>
          This is Header
        </PopoverHeader>
        <PopoverBody>
          This is popover body. Contains the description
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text="Close"
            onClick={handleClosePopover}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};

PopoverPreview.displayName = 'PopoverPreview';

export default PopoverPreview;
