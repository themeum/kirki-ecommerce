import { useState } from 'react';

import Button from '@/components/ui/button';
import type { CategoryFormData } from '@/types';
import { __ } from '@/wpi18n';

import CategoryAddEditPopover from '@/pages/categories/category-add-edit-dialog';

const initialState: CategoryFormData = {
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
