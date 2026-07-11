import { useEffect, useState } from 'react';

import { PlusIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import { Select } from '@/molecules/select';
import {
  addCategoryAPI,
  setKeyValue,
} from '@/store/categoriesSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getErrorsObject } from '@/store/utils';
import type { CategoryFormData, FormErrors, SelectOption } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

const AddNewCategory = () => {
  const dispatch = useAppDispatch();
  const { results: categories } = useAppSelector(
    (state) => state.categories?.data,
  ) ?? { results: [] };
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>(
    {},
  );

  useEffect(() => {
    setCategoryFormData({});
    setErrors({});
  }, [show]);

  const handleOnChange = (data: unknown, fieldName: string) => {
    setCategoryFormData((prev) => ({
      ...prev,
      [fieldName]: data,
    }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleAddOrUpdateCategory = async () => {
    const result = await addCategoryAPI(categoryFormData);
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      setShow(false);
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
    }
  };

  const parentOptions: SelectOption[] = [
    {
      title: __('None', 'kirki-ecommerce'),
      value: null as unknown as string | number,
    },
    ...(categories || []).map((category) => ({
      title: category.name,
      value: category.id,
    })),
  ];
  return (
    <>
      {show ? (
        <Card type="inner">
          <Flex direction="column" gap={16}>
            <Input
              placeholder={__('Category Name', 'kirki-ecommerce')}
              value={(categoryFormData?.name as string) || ''}
              onChange={(value) => handleOnChange(value, 'name')}
              error={errors.name as string | boolean | undefined}
            />
            <Select
              placeholder={__('Select Parent', 'kirki-ecommerce')}
              value={(categoryFormData?.parent_id as string | number) || ''}
              onChange={(value) => handleOnChange(value, 'parent_id')}
              optionsArray={parentOptions}
              error={errors.parent_id as string | boolean | undefined}
            />
            <ActionGroup>
              <Button
                type="secondary"
                size="small"
                text={__('Cancel', 'kirki-ecommerce')}
                onClick={() => setShow(false)}
              />
              <Button
                type="primary"
                size="small"
                text={__('OK', 'kirki-ecommerce')}
                onClick={handleAddOrUpdateCategory}
              />
            </ActionGroup>
          </Flex>
        </Card>
      ) : (
        <Button
          type="blank"
          text={__('Create New Category', 'kirki-ecommerce')}
          leftIcon={<PlusIcon />}
          onClick={() => setShow(true)}
        />
      )}
    </>
  );
};

export default AddNewCategory;
