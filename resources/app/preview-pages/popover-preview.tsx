import { useState } from 'react';

import Button from '@/components/ui/button';
import { Dialog, DialogClose, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const PopoverPreview = () => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Click</Button>
        </DialogTrigger>
        <DialogContent style={{ width: 400 }}>
          <DialogCloseButton />
          <DialogHeader>
            <DialogTitle>This is Header</DialogTitle>
            <DialogDescription>
              This is popover body. Contains the description
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

PopoverPreview.displayName = 'PopoverPreview';

export default PopoverPreview;
