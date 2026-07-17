import { useState } from 'react';

import Button from '@/components/ui/button';
import type { TagFormData } from '@/types';
import { __ } from '@/wpi18n';

import TagAddEditPopover from '@/pages/tags/tag-add-edit-popover';

const initialState: TagFormData = {
  name: '',
  slug: '',
  description: '',
};

const NewTag = () => {
  const [openPopup, setOpenPopup] = useState(false);
  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setOpenPopup(true)}
      >
        {__('New Tag', 'kirki-ecommerce')}
      </Button>

      {openPopup && (
        <TagAddEditPopover
          tag={initialState}
          onClose={() => setOpenPopup(false)}
        />
      )}
    </>
  );
};

NewTag.displayName = 'NewTag';

export default NewTag;
