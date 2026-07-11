import { useState } from 'react';

import Button from '@/molecules/button';
import type { BrandFormData } from '@/types';
import { __ } from '@/wpi18n';

import BrandAddEditPopover from './brand-add-edit-popover';

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
        type="primary"
        text={__('New Brand', 'kirki-ecommerce')}
        size="small"
        onClick={() => setOpenPopup(true)}
      />

      {openPopup && (
        <BrandAddEditPopover
          brand={initialState}
          onClose={() => setOpenPopup(false)}
        />
      )}
    </>
  );
};

export default NewBrand;
