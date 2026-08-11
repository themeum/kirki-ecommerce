import { useState } from 'react';

import Button from '@/components/ui/button';
import type { TagFormInput } from '@/schemas/forms/tag-form';
import { __ } from '@/wpi18n';

import TagAddEditDialog from '@/pages/tags/tag-add-edit-dialog';

const initialState: TagFormInput = {
  name: '',
  slug: '',
  description: '',
};

const NewTag = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {__('New Tag', 'kirki-ecommerce')}
      </Button>
      <TagAddEditDialog
        tag={initialState}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

NewTag.displayName = 'NewTag';

export default NewTag;
