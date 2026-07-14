import type { Dispatch, SetStateAction } from 'react';

import Input from '@/molecules/input';
import { useProductForm } from '@/contexts/product-form-context';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

type AEOProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
};

const AEO = ({ errors, setErrors }: AEOProps) => {
  const { product: productData, updateProduct } = useProductForm();

  const handleOnChange = (value: unknown, fieldName: string) => {
    updateProduct({ key: fieldName, value: value });
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  return (
    <Input
      label={__('LLM Instruction', 'kirki-ecommerce')}
      multiline={5}
      value={productData?.llm_instructions ?? ''}
      error={errors?.llm_instructions as string | boolean | undefined}
      onChange={(value) => handleOnChange(value, 'llm_instructions')}
      placeholder={__('llm instructions', 'kirki-ecommerce')}
    />
  );
};

AEO.displayName = 'AEO';

export default AEO;
