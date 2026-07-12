import { useState } from 'react';

import { TagIcon } from '@/icons';
import { getErrorsObject } from '@/libs/api';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import Text from '@/molecules/text';
import { useCreateTagMutation, useUpdateTagMutation } from '@/services/tag';
import type { ErrorResponse } from '@/libs/api';
import type { FormErrors, Tag, TagFormData } from '@/types';
import { __ } from '@/wpi18n';

type TagAddEditPopoverProps = {
  tag: Tag | TagFormData;
  onClose?: () => void;
};

const TagAddEditPopover = ({
  tag,
  onClose = () => {},
}: TagAddEditPopoverProps) => {
  const createMutation = useCreateTagMutation();
  const updateMutation = useUpdateTagMutation();
  const [errors, setErrors] = useState<FormErrors>({});
  const [tagFormData, setTagFormData] = useState<TagFormData & { id?: number }>(
    tag,
  );

  const handleOnChange = (data: unknown, fieldName: string) => {
    setTagFormData((prev) => ({
      ...prev,
      [fieldName]: data,
    }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleAddOrUpdateTag = async () => {
    try {
      if (tagFormData.id) {
        await updateMutation.mutateAsync({
          id: tagFormData.id,
          data: tagFormData,
        });
      } else {
        await createMutation.mutateAsync(tagFormData);
      }
      onClose();
    } catch (error) {
      const err = error as ErrorResponse;
      setErrors(getErrorsObject(err.errors));
    }
  };

  return (
    <>
      <Popover isOpen={true} onClose={onClose}>
        <PopoverHeader
          onClose={onClose}
          leftIcon={<TagIcon />}
          style={{ borderBottom: '1px solid #E4E3E9' }}
        >
          <Text
            type="primary"
            header={
              tagFormData.id
                ? __('Edit Tag', 'kirki-ecommerce')
                : __('New Tag', 'kirki-ecommerce')
            }
          />
        </PopoverHeader>
        <PopoverBody>
          <Flex direction="column" gap={16}>
            <Input
              label={__('Name', 'kirki-ecommerce')}
              placeholder={__('e.g., fundraising', 'kirki-ecommerce')}
              value={tagFormData.name as string}
              onChange={(value) => handleOnChange(value, 'name')}
              error={errors.name as string | boolean | undefined}
            />
            <Input
              label={__('Slug', 'kirki-ecommerce')}
              placeholder={__('e.g., fund-raising', 'kirki-ecommerce')}
              value={tagFormData.slug as string}
              onChange={(value) => handleOnChange(value, 'slug')}
              error={errors.slug as string | boolean | undefined}
            />
            <Input
              label={__('Description', 'kirki-ecommerce')}
              multiline={2}
              style={{ padding: '8px 12px' }}
              error={errors.description as string | boolean | undefined}
              value={tagFormData.description as string}
              onChange={(value) => handleOnChange(value, 'description')}
              placeholder={__(
                'e.g., Dedicated to providing immediate support and essential resources to communities affected by unexpected crises.',
                'kirki-ecommerce',
              )}
            />
          </Flex>
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
              tagFormData.id
                ? __('Save', 'kirki-ecommerce')
                : __('Add', 'kirki-ecommerce')
            }
            onClick={handleAddOrUpdateTag}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};

TagAddEditPopover.displayName = 'TagAddEditPopover';

export default TagAddEditPopover;
