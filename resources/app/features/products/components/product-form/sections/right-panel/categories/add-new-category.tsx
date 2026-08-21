import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { useCategoriesQuery, useCreateCategoryMutation } from '@/features/categories';
import {
  type ProductAddCategoryFormInput,
  type ProductAddCategoryFormPayload,
  ProductAddCategoryFormSchema,
} from '@/features/products/schemas/forms/product-add-category-form';
import { PlusIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const AddNewCategory = () => {
  const { data: categoryData } = useCategoriesQuery({ limit: -1 });
  const categories = categoryData?.results ?? [];
  const createCategoryMutation = useCreateCategoryMutation();
  const [show, setShow] = useState(false);

  const form = useForm<ProductAddCategoryFormInput, unknown, ProductAddCategoryFormPayload>({
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

  const handleAddOrUpdateCategory = async (payload: ProductAddCategoryFormPayload) => {
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

  if (show) {
    return (
      <div css={scoped(styles.formWrap)}>
        <Card cssOverride={cardStyles.innerCard}>
          <CardContent cssOverride={styles.formCard}>
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <TextField
                name="name"
                placeholder={__('Category name', 'kirki-ecommerce')}
              />
              <SelectField
                name="parent_id"
                placeholder={__('Select Parent', 'kirki-ecommerce')}
                options={parentOptions}
              />
              <ActionGroup>
                <Button
                  variant="outline"
                  onClick={() => setShow(false)}
                >
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
                <Button
                  variant="primary"
                  onClick={form.handleSubmit(handleAddOrUpdateCategory)}
                >
                  {__('OK', 'kirki-ecommerce')}
                </Button>
              </ActionGroup>
            </Flex>
          </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Button
      variant="link"
      cssOverride={styles.createButton}
      onClick={() => setShow(true)}
    >
      <PlusIcon />
      {__('Create New Category', 'kirki-ecommerce')}
    </Button>
  );
};

AddNewCategory.displayName = 'AddNewCategory';

export default AddNewCategory;

const styles = defineStyles({
  formWrap: {
    width: '100%',
  },
  formCard: {
    padding: theme.spacing[4],
  },
  createButton: {
    backgroundColor: 'transparent',
    color: theme.colors.background.fillBrand,
    padding: 0,
    height: 'auto',
    minHeight: 'unset',
    borderRadius: theme.radius.md,
    '&:hover, &:active, &:focus, &:visited': {
      backgroundColor: 'transparent',
      color: theme.colors.background.fillBrandHover,
    },
  },
});
