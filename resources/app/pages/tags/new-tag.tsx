import { useState } from 'react';

import Button from '@/molecules/button';
import type { TagFormData } from '@/types';
import { __ } from '@/wpi18n';

import TagAddEditPopover from './tag-add-edit-popover';

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
        type="primary"
        text={__('New Tag', 'kirki-ecommerce')}
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
