import { useState } from 'react';

import Button from '@/components/ui/button';
import TagAddEditDialog from '@/features/tags/components/tag-add-edit-dialog';
import type { TagFormInput } from '@/features/tags/schemas/forms/tag-form';
import { __ } from '@/wpi18n';

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
