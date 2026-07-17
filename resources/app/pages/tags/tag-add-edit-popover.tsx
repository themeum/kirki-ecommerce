import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import { TagIcon } from '@/icons';
import { getErrorsObject } from '@/libs/api';
import Flex from '@/molecules/flex';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import Text from '@/molecules/text';
import {
  TagFormSchema,
  type TagFormValues,
} from '@/schemas/forms/tag-form';
import { useCreateTagMutation, useUpdateTagMutation } from '@/services/tag';
import type { ErrorResponse } from '@/libs/api';
import type { Tag, TagFormData } from '@/types';
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
  const tagId = 'id' in tag ? tag.id : undefined;

  const form = useForm<TagFormValues>({
    resolver: zodResolver(TagFormSchema),
    defaultValues: {
      name: tag.name ?? '',
      slug: tag.slug ?? '',
      description: tag.description ?? '',
    },
  });

  const handleSubmit = async (values: TagFormValues) => {
    try {
      if (tagId) {
        await updateMutation.mutateAsync({
          id: tagId,
          data: values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (error) {
      const err = error as ErrorResponse;
      const fieldErrors = getErrorsObject(err.errors);
      Object.entries(fieldErrors).forEach(([key, message]) => {
        if (message) {
          form.setError(key as keyof TagFormValues, {
            message: String(message),
          });
        }
      });
    }
  };

  return (
    <Popover isOpen={true} onClose={onClose}>
      <PopoverHeader
        onClose={onClose}
        leftIcon={<TagIcon />}
        style={{ borderBottom: '1px solid #E4E3E9' }}
      >
        <Text
          type="primary"
          header={
            tagId
              ? __('Edit Tag', 'kirki-ecommerce')
              : __('New Tag', 'kirki-ecommerce')
          }
        />
      </PopoverHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <PopoverBody>
            <Flex direction="column" gap={16}>
              <TextField
                name="name"
                label={__('Name', 'kirki-ecommerce')}
                placeholder={__('e.g., fundraising', 'kirki-ecommerce')}
              />
              <TextField
                name="slug"
                label={__('Slug', 'kirki-ecommerce')}
                placeholder={__('e.g., fund-raising', 'kirki-ecommerce')}
              />
              <TextareaField
                name="description"
                label={__('Description', 'kirki-ecommerce')}
                rows={5}
                placeholder={__(
                  'e.g., Dedicated to providing immediate support and essential resources to communities affected by unexpected crises.',
                  'kirki-ecommerce',
                )}
              />
            </Flex>
          </PopoverBody>
          <PopoverFooter>
            <Button variant="outline" onClick={onClose}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                form.handleSubmit(handleSubmit)();
              }}
            >
              {tagId
                ? __('Save', 'kirki-ecommerce')
                : __('Add', 'kirki-ecommerce')}
            </Button>
            <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
          </PopoverFooter>
        </form>
      </Form>
    </Popover>
  );
};

TagAddEditPopover.displayName = 'TagAddEditPopover';

export default TagAddEditPopover;
