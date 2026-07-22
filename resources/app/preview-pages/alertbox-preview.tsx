import { useState } from 'react';

import Button from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AlertboxPreview = () => {
  const [openAlertbox, setOpenAlertbox] = useState(false);

  return (
    <div>
      <Dialog open={openAlertbox} onOpenChange={setOpenAlertbox}>
        <DialogTrigger asChild>
          <Button variant="outline">Alert Button</Button>
        </DialogTrigger>
        <DialogContent style={{ width: 400 }}>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers. Beware!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                onClick={() => {
                  console.log('closed alert');
                }}
              >
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="primary"
                onClick={() => {
                  console.log('action performed');
                }}
              >
                OK
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

AlertboxPreview.displayName = 'AlertboxPreview';

export default AlertboxPreview;
