import { useState } from 'react';

import ThumbnailSelector from '@/components/thumbnail-selector';
import { CategoryPopupIcon } from '@/icons';
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
  addCategoryAPI,
  setKeyValue,
  updateCategory,
  updateCategoryAPI,
} from '@/store/categoriesSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getErrorsObject } from '@/store/utils';
import type { Category, CategoryFormData, FormErrors, MediaChangePayload } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

type CategoryAddEditPopoverProps = {
  category: Category | CategoryFormData;
  onClose?: () => void;
};

const CategoryAddEditPopover = ({
  category,
  onClose = () => {},
}: CategoryAddEditPopoverProps) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(
    (state) => state.categories?.data?.results ?? [],
  );
  const image =
    category.image && typeof category.image === 'object'
      ? category.image
      : null;
  const [imageUrl, setImageUrl] = useState<string | null>(image?.url || null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [categoryFormData, setCategoryFormData] =
    useState<CategoryFormData & { id?: number }>(category);

  const handleOnChange = (data: unknown, fieldName: string) => {
    console.log(data, fieldName);
    setCategoryFormData((prev) => ({
      ...prev,
      [fieldName]: data,
    }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleMediaChange = (img: MediaChangePayload | MediaChangePayload[]) => {
    const media = img as MediaChangePayload;
    setImageUrl(media?.url ?? null);
    setCategoryFormData((prev) => ({
      ...prev,
      image: media?.id,
    }));
  };

  const handleAddOrUpdateCategory = async () => {
    let result = {} as Awaited<ReturnType<typeof addCategoryAPI>>;
    if (categoryFormData.id) {
      result = await updateCategoryAPI(categoryFormData.id, categoryFormData);
    } else {
      result = await addCategoryAPI(categoryFormData);
    }
    if (isApiSuccess(result)) {
      if (categoryFormData.id) {
        dispatch(updateCategory(result.data));
      } else {
        dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      }
      onClose();
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
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

export default CategoryAddEditPopover;
