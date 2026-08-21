import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Text from '@/components/ui/text';
import SchemaPropertyField from '@/features/settings/essentials/components/fields/schema-property-field';
import type { SchemaProfile } from '@/features/settings/essentials/schemas/catalog/schema-profile';
import {
  type SchemaProfileFormInput,
  type SchemaProfileFormPayload,
  SchemaProfileFormSchema,
} from '@/features/settings/essentials/schemas/forms/schema-profile-form';
import { useCreateSchemaMutation, useUpdateSchemaMutation } from '@/features/settings/essentials/services/schema';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { pickFormValues } from '@/libs/zod';
import { __, sprintf } from '@/wpi18n';

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

  const form = useForm<SchemaProfileFormInput, unknown, SchemaProfileFormPayload>({
    resolver: zodResolver(SchemaProfileFormSchema),
    defaultValues: pickFormValues(SchemaProfileFormSchema, {}, { schema: defaultSchemaValues }),
  });

  const nameValue = form.watch('name');
  const selectedValues = form.watch('schema');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editedItem) {
      form.reset(
        pickFormValues(SchemaProfileFormSchema, editedItem, {
          schema: editedItem.schema ?? defaultSchemaValues,
        }),
      );
      return;
    }

    form.reset(pickFormValues(SchemaProfileFormSchema, {}, { schema: defaultSchemaValues }));
  }, [isOpen, editedItem, form]);

  const handleSubmit = async (payload: SchemaProfileFormPayload) => {
    try {
      if (editedItem) {
        await updateMutation.mutateAsync({
          id: editedItem?.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
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
              <SchemaPropertyField name="schema" />
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
