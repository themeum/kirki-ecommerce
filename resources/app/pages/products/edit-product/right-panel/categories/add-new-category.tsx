import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import { Form } from '@/components/ui/form';
import { PlusIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import {
  ProductAddCategoryFormSchema,
  type ProductAddCategoryFormValues,
} from '@/schemas/forms/product-add-category-form';
import {
  useCreateCategoryMutation,
  useCategoriesQuery,
} from '@/services/category';
import type { CategoryFormData } from '@/types';
import { __ } from '@/wpi18n';

const AddNewCategory = () => {
  const { data: categoryData } = useCategoriesQuery({ limit: -1 });
  const categories = categoryData?.results ?? [];
  const createCategoryMutation = useCreateCategoryMutation();
  const [show, setShow] = useState(false);

  const form = useForm<ProductAddCategoryFormValues>({
    resolver: zodResolver(ProductAddCategoryFormSchema),
    defaultValues: {
      name: '',
      parent_id: null,
    },
  });

  useEffect(() => {
    if (!show) {
      return;
    }

    form.reset({
      name: '',
      parent_id: null,
    });
  }, [show, form]);

  const handleAddOrUpdateCategory = async (
    values: ProductAddCategoryFormValues,
  ) => {
    const payload: CategoryFormData = {
      name: values.name,
      parent_id:
        values.parent_id === '' || values.parent_id == null
          ? null
          : Number(values.parent_id),
    };

    try {
      await createCategoryMutation.mutateAsync(payload);
      setShow(false);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const parentOptions = [
    {
      label: __('None', 'kirki-ecommerce'),
      value: '',
    },
    ...categories.map((category) => ({
      label: category.name,
      value: String(category.id),
    })),
  ];

  return (
    <>
      {show ? (
        <Card type="inner">
          <Form {...form}>
            <Flex direction="column" gap={16}>
              <TextField
                name="name"
                placeholder={__('Category Name', 'kirki-ecommerce')}
              />
              <SelectField
                name="parent_id"
                placeholder={__('Select Parent', 'kirki-ecommerce')}
                options={parentOptions}
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
                  onClick={form.handleSubmit(handleAddOrUpdateCategory)}
                />
              </ActionGroup>
            </Flex>
          </Form>
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

AddNewCategory.displayName = 'AddNewCategory';

export default AddNewCategory;
