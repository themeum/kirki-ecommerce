import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { pickFormValues } from '@/libs/zod';
import type { Tag } from '@/schemas/catalog/tag';
import {
  type TagFormInput,
  type TagFormPayload,
  TagFormSchema,
} from '@/schemas/forms/tag-form';
import { useCreateTagMutation, useUpdateTagMutation } from '@/services/tag';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type TagAddEditDialogProps = {
  tag: Tag | TagFormInput;
  open: boolean;
  onClose?: () => void;
};

const TagAddEditDialog = ({
  tag,
  open,
  onClose = noop,
}: TagAddEditDialogProps) => {
  const createMutation = useCreateTagMutation();
  const updateMutation = useUpdateTagMutation();
  const tagId = 'id' in tag ? tag.id : undefined;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<TagFormInput, unknown, TagFormPayload>({
    resolver: zodResolver(TagFormSchema),
    defaultValues: pickFormValues(TagFormSchema, tag),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(pickFormValues(TagFormSchema, tag));
  }, [open, tag, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  const handleSubmit = async (payload: TagFormPayload) => {
    try {
      if (tagId) {
        await updateMutation.mutateAsync({
          id: tagId,
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
            <DialogBody>
              <Flex direction="column" gap={4}>
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
            </DialogBody>
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
