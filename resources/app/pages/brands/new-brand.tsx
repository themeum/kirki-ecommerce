import { useState } from 'react';

import Button from '@/components/ui/button';
import type { BrandFormData } from '@/types';
import { __ } from '@/wpi18n';

import BrandAddEditPopover from '@/pages/brands/brand-add-edit-dialog';

const initialState: BrandFormData = {
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
        size="sm"
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
