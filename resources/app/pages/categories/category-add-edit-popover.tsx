import { useState } from 'react';

import ThumbnailSelector from '@/components/thumbnail-selector';
import { CategoryPopupIcon } from '@/icons';
import { getErrorsObject } from '@/libs/api';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from '@/services/category';
import type {
  Category,
  CategoryFormData,
  FormErrors,
  MediaChangePayload,
} from '@/types';
import type { ErrorResponse } from '@/libs/api';
import { __ } from '@/wpi18n';

type CategoryAddEditPopoverProps = {
  category: Category | CategoryFormData;
  onClose?: () => void;
};

const CategoryAddEditPopover = ({
  category,
  onClose = () => {},
}: CategoryAddEditPopoverProps) => {
  const { data: categoriesData } = useCategoriesQuery({ limit: -1 });
  const categories = categoriesData?.results ?? [];
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();

  const image =
    category.image && typeof category.image === 'object'
      ? category.image
      : null;
  const [imageUrl, setImageUrl] = useState<string | null>(image?.url || null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [categoryFormData, setCategoryFormData] =
    useState<CategoryFormData & { id?: number }>(category);

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

  const handleMediaChange = (
    img: MediaChangePayload | MediaChangePayload[],
  ) => {
    const media = img as MediaChangePayload;
    setImageUrl(media?.url ?? null);
    setCategoryFormData((prev) => ({
      ...prev,
      image: media?.id,
    }));
  };

  const handleAddOrUpdateCategory = async () => {
    try {
      if (categoryFormData.id) {
        await updateMutation.mutateAsync({
          id: categoryFormData.id,
          data: categoryFormData,
        });
      } else {
        await createMutation.mutateAsync(categoryFormData);
      }
      onClose();
    } catch (error) {
      const err = error as ErrorResponse;
      setErrors(getErrorsObject(err.errors));
    }
  };

  const parentOptions = [
    {
      title: __('None', 'kirki-ecommerce'),
      value: null as unknown as string | number,
    },
    ...categories.map((item) => ({
      title: item.name,
      value: item.id,
    })),
  ];

  return (
    <>
      <Popover isOpen={true} onClose={onClose}>
        <PopoverHeader
          onClose={onClose}
          leftIcon={<CategoryPopupIcon />}
          style={{ borderBottom: '1px solid #E4E3E9' }}
        >
          <Text
            type="primary"
            header={
              categoryFormData.id
                ? __('Edit Category', 'kirki-ecommerce')
                : __('New Category', 'kirki-ecommerce')
            }
          />
        </PopoverHeader>
        <PopoverBody>
          <Card type="light">
            <Flex direction="column" gap={16}>
              <Input
                label={__('Name', 'kirki-ecommerce')}
                placeholder={__('e.g., Fundraising', 'kirki-ecommerce')}
                value={categoryFormData.name as string}
                onChange={(value) => handleOnChange(value, 'name')}
                error={errors.name as string | boolean | undefined}
              />
              <Input
                label={__('Slug', 'kirki-ecommerce')}
                placeholder={__('e.g., fundraising', 'kirki-ecommerce')}
                value={categoryFormData.slug as string}
                onChange={(value) => handleOnChange(value, 'slug')}
                error={errors.slug as string | boolean | undefined}
              />
              <Select
                label={__('Parent', 'kirki-ecommerce')}
                value={
                  (categoryFormData.parent_id ?? undefined) as
                    | string
                    | number
                    | undefined
                }
                onChange={(value) => handleOnChange(value, 'parent_id')}
                optionsArray={parentOptions}
                error={errors.parent_id as string | boolean | undefined}
              />

              <Input
                label={__('Description', 'kirki-ecommerce')}
                multiline={2}
                style={{ padding: '8px 12px' }}
                error={errors.description as string | boolean | undefined}
                value={categoryFormData.description as string}
                onChange={(value) => handleOnChange(value, 'description')}
                placeholder={__(
                  'e.g., Dedicated to providing immediate support and essential resources to communities affected by unexpected crises.',
                  'kirki-ecommerce',
                )}
              />
              <ThumbnailSelector
                src={imageUrl ?? undefined}
                label={__('Thumb', 'kirki-ecommerce')}
                error={errors.image as string | boolean | undefined}
                onChange={(img) => handleMediaChange(img)}
              />
            </Flex>
          </Card>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__('Cancel', 'kirki-ecommerce')}
            onClick={onClose}
          />
          <Button
            type="primary"
            text={
              categoryFormData.id
                ? __('Save', 'kirki-ecommerce')
                : __('Add', 'kirki-ecommerce')
            }
            onClick={handleAddOrUpdateCategory}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};

CategoryAddEditPopover.displayName = 'CategoryAddEditPopover';

export default CategoryAddEditPopover;
