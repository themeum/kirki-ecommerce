import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import type { Category } from '@/features/categories/schemas/catalog/category';
import {
  type CategoryFormInput,
  type CategoryFormPayload,
  CategoryFormSchema,
} from '@/features/categories/schemas/forms/category-form';
import { useCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation } from '@/features/categories/services/category';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { pickFormValues } from '@/libs/zod';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type CategoryAddEditPopoverProps = {
  category: Category | CategoryFormInput;
  onClose?: () => void;
};

const getInitialImageUrl = (category: Category | CategoryFormInput) => {
  const image =
    category.image && typeof category.image === 'object'
      ? category.image
      : null;
  return image?.url || null;
};

const CategoryAddEditPopover = ({
  category,
  onClose = noop,
}: CategoryAddEditPopoverProps) => {
  const { data: categoriesData } = useCategoriesQuery({ limit: -1 });
  const categories = categoriesData?.results ?? [];
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const categoryId = 'id' in category ? category.id : undefined;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CategoryFormInput, unknown, CategoryFormPayload>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: pickFormValues(CategoryFormSchema, category),
  });

  const [imageUrl, setImageUrl] = useState<string | null>(
    getInitialImageUrl(category),
  );

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

  const handleSubmit = async (payload: CategoryFormPayload) => {
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
                <CardContent cssOverride={{ paddingTop: theme.spacing[4], paddingBottom: theme.spacing[4] }}>
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
