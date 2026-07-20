import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import GroupTagTable from '@/components/group-tag-table';
import TextField from '@/components/form/text-field';
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import Text from '@/molecules/text';
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
    <Popover isOpen={isOpen} onClose={onClose}>
      <PopoverHeader
        style={{ padding: 'var(--decom-spacing-5)' }}
        onClose={onClose}
      >
        {editedItem
          ? __('Update schema profile', 'kirki-ecommerce')
          : __('Create schema profile', 'kirki-ecommerce')}
      </PopoverHeader>
      <Form {...form}>
        <PopoverBody
          style={{
            padding:
              'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
          }}
        >
          <Flex direction="column" gap={16}>
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
        </PopoverBody>
        <PopoverFooter style={{ justifyContent: 'space-between' }}>
          <Text
            type="secondary"
            header={sprintf(
              __('%d selected', 'kirki-ecommerce'),
              Object.keys(selectedValues)?.length,
            )}
          />
          <ActionGroup>
            <Button
              text={__('Cancel', 'kirki-ecommerce')}
              type="outlined"
              size="small"
              onClick={onClose}
            />
            <Button
              text={__('Save schema', 'kirki-ecommerce')}
              type="primary"
              size="small"
              onClick={form.handleSubmit(handleSubmit)}
              state={
                isSubmitting ? 'loading' : buttonState ? 'disabled' : ''
              }
            />
          </ActionGroup>
        </PopoverFooter>
      </Form>
    </Popover>
  );
};

AddSchemaPopup.displayName = 'AddSchemaPopup';

export default AddSchemaPopup;
