import { useState } from 'react';

import Button from '@/molecules/button';
import type { CategoryFormData } from '@/types';
import { __ } from '@/wpi18n';

import CategoryAddEditPopover from '@/pages/categories/category-add-edit-popover';

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
        type="primary"
        text={__('New Category', 'kirki-ecommerce')}
        size="small"
        onClick={() => setOpenPopup(true)}
      />

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
