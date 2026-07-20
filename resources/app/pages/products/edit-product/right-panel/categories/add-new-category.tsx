import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { CLASS_PREFIX } from '@/conf';
import { PlusIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import ActionGroup from '@/molecules/action-group';
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
        <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner`}>
          <CardContent>
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
                    variant="secondary"
                    size="sm"
                    onClick={() => setShow(false)}
                  >
                    {__('Cancel', 'kirki-ecommerce')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={form.handleSubmit(handleAddOrUpdateCategory)}
                  >
                    {__('OK', 'kirki-ecommerce')}
                  </Button>
                </ActionGroup>
              </Flex>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setShow(true)}>
          <PlusIcon />
          {__('Create New Category', 'kirki-ecommerce')}
        </Button>
      )}
    </>
  );
};

AddNewCategory.displayName = 'AddNewCategory';

export default AddNewCategory;
