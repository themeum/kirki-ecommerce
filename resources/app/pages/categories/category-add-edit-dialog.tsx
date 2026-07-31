import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import SelectField from '@/components/form/select-field';
import TextareaField from '@/components/form/textarea-field';
import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { applyServerErrors } from '@/libs/form-errors';
import type { ErrorResponse } from '@/libs/api';
import Flex from '@/components/ui/flex';
import { CategoryFormSchema, type CategoryFormValues } from '@/schemas/forms/category-form';
import { useCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation } from '@/services/category';
import type { Category, CategoryFormData } from '@/types';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

type CategoryAddEditPopoverProps = {
  category: Category | CategoryFormData;
  onClose?: () => void;
};

const getInitialImageUrl = (category: Category | CategoryFormData) => {
  const image =
    category.image && typeof category.image === 'object'
      ? category.image
      : null;
  return image?.url || null;
};

const getImageId = (category: Category | CategoryFormData) => {
  if (category.image && typeof category.image === 'object') {
    return category.image.id ?? null;
  }
  if (typeof category.image === 'number' || typeof category.image === 'string') {
    return category.image;
  }
  return null;
};

const CategoryAddEditPopover = ({
  category,
  onClose = () => {},
}: CategoryAddEditPopoverProps) => {
  const { data: categoriesData } = useCategoriesQuery({ limit: -1 });
  const categories = categoriesData?.results ?? [];
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const categoryId = 'id' in category ? category.id : undefined;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const [imageUrl, setImageUrl] = useState<string | null>(
    getInitialImageUrl(category),
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      name: category.name ?? '',
      slug: category.slug ?? '',
      description: category.description ?? '',
      parent_id: category.parent_id ?? null,
      image: getImageId(category),
      is_active: category.is_active,
    },
  });

  const parentOptions = [
    {
      label: __('None', 'kirki-ecommerce'),
      value: '',
    },
    ...categories.map((item) => ({
      label: item.name,
      value: String(item.id),
    })),
  ];

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  const handleSubmit = async (values: CategoryFormValues) => {
    const payload: CategoryFormData = {
      ...values,
      parent_id:
        values.parent_id === '' || values.parent_id == null
          ? null
          : Number(values.parent_id),
      image: values.image ?? null,
    };

    try {
      if (categoryId) {
        await updateMutation.mutateAsync({
          id: categoryId,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {categoryId
              ? __('Edit Category', 'kirki-ecommerce')
              : __('New Category', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogBody>
              <Card cssOverride={cardStyles.lightCard}>
                <CardContent>
                  <Flex direction="column" gap={4}>
                    <TextField
                      name="name"
                      label={__('Name', 'kirki-ecommerce')}
                      placeholder={__('e.g., Fundraising', 'kirki-ecommerce')}
                    />
                    <TextField
                      name="slug"
                      label={__('Slug', 'kirki-ecommerce')}
                      placeholder={__('e.g., fundraising', 'kirki-ecommerce')}
                    />
                    <SelectField
                      name="parent_id"
                      label={__('Parent', 'kirki-ecommerce')}
                      options={parentOptions}
                      placeholder={__('None', 'kirki-ecommerce')}
                    />
                    <TextareaField
                      name="description"
                      label={__('Description', 'kirki-ecommerce')}
                      rows={2}
                      placeholder={__(
                        'e.g., Dedicated to providing immediate support and essential resources to communities affected by unexpected crises.',
                        'kirki-ecommerce',
                      )}
                    />
                    <ThumbnailField
                      name="image"
                      label={__('Thumb', 'kirki-ecommerce')}
                      valueAs="id"
                      previewUrl={imageUrl}
                      onPreviewChange={setImageUrl}
                    />
                  </Flex>
                </CardContent>
              </Card>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                >
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
              </DialogClose>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {categoryId
                  ? __('Save', 'kirki-ecommerce')
                  : __('Add', 'kirki-ecommerce')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

CategoryAddEditPopover.displayName = 'CategoryAddEditPopover';

export default CategoryAddEditPopover;

