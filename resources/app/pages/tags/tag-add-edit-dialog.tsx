import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextareaField from '@/components/form/textarea-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { CLASS_PREFIX } from '@/conf';
import { getErrorsObject, type ErrorResponse } from '@/libs/api';
import Flex from '@/components/ui/flex';
import {
  TagFormSchema,
  type TagFormValues,
} from '@/schemas/forms/tag-form';
import { useCreateTagMutation, useUpdateTagMutation } from '@/services/tag';
import type { Tag, TagFormData } from '@/types';
import { __ } from '@/wpi18n';

type TagAddEditDialogProps = {
  tag: Tag | TagFormData;
  open: boolean;
  onClose?: () => void;
};

const TagAddEditDialog = ({
  tag,
  open,
  onClose = () => {},
}: TagAddEditDialogProps) => {
  const createMutation = useCreateTagMutation();
  const updateMutation = useUpdateTagMutation();
  const tagId = 'id' in tag ? tag.id : undefined;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<TagFormValues>({
    resolver: zodResolver(TagFormSchema),
    defaultValues: {
      name: tag.name ?? '',
      slug: tag.slug ?? '',
      description: tag.description ?? '',
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      name: tag.name ?? '',
      slug: tag.slug ?? '',
      description: tag.description ?? '',
    });
  }, [open, tag, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {tagId
              ? __('Edit Tag', 'kirki-ecommerce')
              : __('New Tag', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className={`${CLASS_PREFIX}-ui-dialog-body`}>
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
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
              >
                {tagId
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

TagAddEditDialog.displayName = 'TagAddEditDialog';

export default TagAddEditDialog;
