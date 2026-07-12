import React from 'react';

import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import { Select } from '@/molecules/select';
import { useAppSelector } from '@/store/hooks';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import Brand from '@/pages/products/edit-product/right-panel/brand';
import Categories from '@/pages/products/edit-product/right-panel/categories/categories';
import Collections from '@/pages/products/edit-product/right-panel/collections';
import Tags from '@/pages/products/edit-product/right-panel/tags';

type RightPanelProps = {
  handleOnChange: (value: unknown, fieldName: string) => void;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
};

const RightPanel = ({
  handleOnChange,
  errors,
  setErrors,
}: RightPanelProps) => {
  const { data: productData } = useAppSelector((state) => state.product);

  return (
    <div style={{ width: '30%' }}>
      <Flex direction="column" gap={16}>
        <Card type="form">
          <Select
            value={productData?.status}
            label={__('Status', 'kirki-ecommerce')}
            optionsArray={[
              { value: 'draft', title: __('Draft', 'kirki-ecommerce') },
              {
                value: 'published',
                title: __('Published', 'kirki-ecommerce'),
              },
              {
                value: 'unpublished',
                title: __('Unpublished', 'kirki-ecommerce'),
              },
              {
                value: 'archived',
                title: __('Archived', 'kirki-ecommerce'),
              },
            ]}
            onChange={(value) => handleOnChange(value, 'status')}
            onClose={() => console.log('dropdown closed')}
            error={errors?.status as string | boolean | undefined}
          />
        </Card>
        <Categories errors={errors} setErrors={setErrors} />
        <Card type="form">
          <Tags errors={errors} setErrors={setErrors} />
          <Collections errors={errors} setErrors={setErrors} />
          <Brand />
        </Card>
      </Flex>
    </div>
  );
};

export default RightPanel;
