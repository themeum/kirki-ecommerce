import { useState } from 'react';

import Button from '@/components/ui/button';
import BrandAddEditPopover from '@/features/brands/components/brand-add-edit-dialog';
import type { BrandFormInput } from '@/features/brands/schemas/forms/brand-form';
import { __ } from '@/wpi18n';

const initialState: BrandFormInput = {
  name: '',
  slug: '',
  description: '',
  logo: null,
};

const NewBrandButton = ({ label = __('New Brand', 'kirki-ecommerce') }: { label?: string }) => {
  const [openPopup, setOpenPopup] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpenPopup(true)}>
        {label}
      </Button>

      {openPopup && (
        <BrandAddEditPopover brand={initialState} onClose={() => setOpenPopup(false)} />
      )}
    </>
  );
};

NewBrandButton.displayName = 'NewBrandButton';

export default NewBrandButton;
