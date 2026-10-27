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

const NewCategoryButton = ({
  label = __('New Category', 'kirki-ecommerce'),
}: {
  label?: string;
}) => {
  const [openPopup, setOpenPopup] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpenPopup(true)}>
        {label}
      </Button>

      {openPopup && (
        <CategoryAddEditPopover category={initialState} onClose={() => setOpenPopup(false)} />
      )}
    </>
  );
};

NewCategoryButton.displayName = 'NewCategoryButton';

export default NewCategoryButton;
