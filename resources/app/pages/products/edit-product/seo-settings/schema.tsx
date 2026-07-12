import { useState, type Dispatch, type SetStateAction } from 'react';

import GroupTagTable from '@/components/group-tag-table';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import { Select } from '@/molecules/select';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProduct } from '@/store/productSlice';
import type { FormErrors, SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import { groupDetails, optionsList, requiredFields } from '@/pages/products/edit-product/seo-settings/utils';

type SchemaProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
};

type GroupedValues = Record<string, Array<string | number>>;

const Schema = ({ errors, setErrors }: SchemaProps) => {
  const dispatch = useAppDispatch();
  const { data: productData } = useAppSelector((state) => state.product);
  const [selectedValues, setSelectedValues] = useState<GroupedValues>({
    Product: ['name'],
    Offer: ['price'],
  });

  const handleOnChange = (value: unknown, fieldName: string) => {
    dispatch(updateProduct({ key: fieldName, value: value }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleOnSelectionChange = (value: GroupedValues) => {
    setSelectedValues(value);
  };

  return (
    <Flex direction="column" gap={16}>
      <Select
        label={__('Schema', 'kirki-ecommerce')}
        optionsArray={[
          {
            value: 'default',
            title: __('Default SEO Profile', 'kirki-ecommerce'),
          },
          {
            value: 'custom',
            title: __('Custom SEO Profile', 'kirki-ecommerce'),
          },
        ]}
        value={productData?.schema_id as string | number | undefined}
        onChange={(value) => handleOnChange(value, 'schema_id')}
        error={errors?.schema_id as string | boolean | undefined}
      />
      <GroupTagTable
        groupDetails={groupDetails}
        selectedValues={selectedValues}
        optionsArray={optionsList as SelectOption[]}
        requiredFields={requiredFields}
        onChange={(value) => handleOnSelectionChange(value)}
        hasSelect
        isEditable
      />
      <Card type="inner">askjdasjdajosidaosij</Card>
    </Flex>
  );
};

Schema.displayName = 'Schema';

export default Schema;
