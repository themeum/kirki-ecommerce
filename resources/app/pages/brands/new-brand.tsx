import { useState } from 'react';

import Button from '@/components/ui/button';
import type { BrandFormInput } from '@/schemas/forms/brand-form';
import { __ } from '@/wpi18n';

import BrandAddEditPopover from '@/pages/brands/brand-add-edit-dialog';

const initialState: BrandFormInput = {
  name: '',
  slug: '',
  description: '',
  logo: null,
};

const NewBrand = () => {
  const [openPopup, setOpenPopup] = useState(false);
  return (
    <>
      <Button
        variant="primary"
        onClick={() => setOpenPopup(true)}
      >
        {__('New Brand', 'kirki-ecommerce')}
      </Button>

      {openPopup && (
        <BrandAddEditPopover
          brand={initialState}
          onClose={() => setOpenPopup(false)}
        />
      )}
    </>
  );
};

NewBrand.displayName = 'NewBrand';

export default NewBrand;
