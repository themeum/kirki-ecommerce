import { useState } from 'react';

import Button from '@/components/ui/button';
import CategoryAddEditPopover from '@/features/categories/components/category-add-edit-dialog';
import type { CategoryFormInput } from '@/features/categories/schemas/forms/category-form';
import { __ } from '@/wpi18n';

const initialState: CategoryFormInput = {
  name: '',
  slug: '',
  parent_id: null,
  description: '',
  image: null,
};

const NewCategory = () => {
  const [openPopup, setOpenPopup] = useState(false);
  return (
    <>
      <Button
        variant="primary"
        onClick={() => setOpenPopup(true)}
      >
        {__('New Category', 'kirki-ecommerce')}
      </Button>

      {openPopup && (
        <CategoryAddEditPopover
          category={initialState}
          onClose={() => setOpenPopup(false)}
        />
      )}
    </>
  );
};

export default NewCategory;
