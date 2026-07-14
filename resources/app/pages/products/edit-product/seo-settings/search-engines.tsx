import type { Dispatch, SetStateAction } from 'react';

import Input from '@/molecules/input';
import { useProductForm } from '@/contexts/product-form-context';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

type SearchEnginesProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
};

const SearchEngines = ({ errors, setErrors }: SearchEnginesProps) => {
  const { product: productData, updateProduct } = useProductForm();

  const handleOnChange = (value: unknown, fieldName: string) => {
    updateProduct({ key: fieldName, value: value });
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  return (
    <>
      <Input
        label={__('Title', 'kirki-ecommerce')}
        placeholder={__('e.g. Example T-shirt', 'kirki-ecommerce')}
        type="text"
        value={productData?.seo_title ?? ''}
        onChange={(value) => handleOnChange(value, 'seo_title')}
        error={errors?.seo_title as string | boolean | undefined}
      />
      <Input
        label={__('Meta description', 'kirki-ecommerce')}
        placeholder={__('e.g. Cotton shirts from our store.', 'kirki-ecommerce')}
        multiline={5}
        value={productData?.seo_description ?? ''}
        onChange={(value) => handleOnChange(value, 'seo_description')}
        error={errors?.seo_description as string | boolean | undefined}
      />
    </>
  );
};

SearchEngines.displayName = 'SearchEngines';

export default SearchEngines;
