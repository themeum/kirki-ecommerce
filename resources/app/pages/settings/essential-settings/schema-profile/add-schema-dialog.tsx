import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import GroupTagTable from '@/components/group-tag-table';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import {
  SchemaProfileFormSchema,
  type SchemaProfileFormValues,
} from '@/schemas/forms/schema-profile-form';
import {
  useCreateSchemaMutation,
  useUpdateSchemaMutation,
} from '@/services/schema';
import type { SchemaFormData, SchemaProfile, SelectOption } from '@/types';
import { __, sprintf } from '@/wpi18n';

import {
  groupDetails,
  optionsList,
  requiredFields,
} from '@/pages/products/edit-product/seo-settings/utils';

type AddSchemaPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  editedItem: SchemaProfile | null;
  setEditedItem: Dispatch<SetStateAction<SchemaProfile | null>>;
  onSuccess?: () => void;
};

const defaultSchemaValues: Record<string, string[]> = {
  Product: ['name'],
  Offer: ['price'],
};

const AddSchemaPopup = ({
  isOpen,
  onClose,
  editedItem,
  setEditedItem,
  onSuccess,
}: AddSchemaPopupProps) => {
  const createMutation = useCreateSchemaMutation();
  const updateMutation = useUpdateSchemaMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<SchemaProfileFormValues>({
    resolver: zodResolver(SchemaProfileFormSchema),
    defaultValues: {
      name: '',
      schema: defaultSchemaValues,
      is_default: false,
    },
  });

  const nameValue = form.watch('name');
  const selectedValues = form.watch('schema');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editedItem) {
      form.reset({
        name: editedItem?.name ?? '',
        schema: editedItem?.schema ?? defaultSchemaValues,
        is_default: editedItem?.is_default || false,
      });
      return;
    }

    form.reset({
      name: '',
      schema: defaultSchemaValues,
      is_default: false,
    });
  }, [isOpen, editedItem, form]);

  const handleSubmit = async (values: SchemaProfileFormValues) => {
    const data: SchemaFormData = {
      name: values.name,
      is_default: values.is_default || false,
      schema: values.schema,
    };

    try {
      if (editedItem) {
        await updateMutation.mutateAsync({
          id: editedItem?.id as number,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      setEditedItem(null);
      onSuccess?.();
      onClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const buttonState =
    nameValue === '' || Object.values(selectedValues)?.length <= 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {editedItem
              ? __('Update schema profile', 'kirki-ecommerce')
              : __('Create schema profile', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <Flex direction="column" gap={4}>
              <TextField
                name="name"
                label={__('Schema preset name', 'kirki-ecommerce')}
                placeholder={__('e.g General', 'kirki-ecommerce')}
              />
              <FormField
                control={form.control}
                name="schema"
                render={({ field }) => (
                  <FormItem>
                    <GroupTagTable
                      groupDetails={groupDetails}
                      selectedValues={field.value}
                      optionsArray={optionsList as SelectOption[]}
                      requiredFields={requiredFields}
                      onChange={(value) =>
                        field.onChange(value as Record<string, string[]>)
                      }
                      hasSelect
                      isEditable
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Flex>
          </DialogBody>
          <DialogFooter style={{ justifyContent: 'space-between' }}>
            <Text weight="medium">{sprintf(
                __('%d selected', 'kirki-ecommerce'),
                Object.keys(selectedValues)?.length,
              )}</Text>
            <ActionGroup>
              <Button variant="outline" onClick={onClose}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={form.handleSubmit(handleSubmit)}
                loading={isSubmitting}
                disabled={buttonState}
              >
                {__('Save schema', 'kirki-ecommerce')}
              </Button>
            </ActionGroup>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

AddSchemaPopup.displayName = 'AddSchemaPopup';

export default AddSchemaPopup;
