import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import GroupTagTable from '@/components/group-tag-table';
import ActionGroup from '@/molecules/action-group';
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
import {
  createSchemaProfileAPI,
  setKeyValue,
  updateSchemaProfileAPI,
} from '@/store/schemaSlice';
import { useAppDispatch } from '@/store/hooks';
import { getErrorsObject } from '@/store/utils';
import type { FormErrors, SchemaFormData, SchemaProfile, SelectOption } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
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
};

const AddSchemaPopup = ({
  isOpen,
  onClose,
  editedItem,
  setEditedItem,
}: AddSchemaPopupProps) => {
  const dispatch = useAppDispatch();

  const [errors, setErrors] = useState<FormErrors>({});
  const [schemaName, setSchemaName] = useState('');
  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>({
    Product: ['name'],
    Offer: ['price'],
  });

  useEffect(() => {
    if (editedItem) {
      setSchemaName(editedItem?.name);
      setSelectedValues(editedItem?.schema);
    }
  }, [editedItem]);

  const handleOnSelectionChange = (value: Record<string, string[]>) => {
    setSelectedValues(value);
  };

  const handleAddOrUpdateSchema = async () => {
    const data: SchemaFormData = {
      name: schemaName,
      is_default: editedItem?.is_default || false,
      schema: selectedValues,
    };
    if (!schemaName) {
      setErrors({ name: 'Schema name cannot be empty' });
      return;
    }
    let result: Awaited<ReturnType<typeof createSchemaProfileAPI>>;
    if (editedItem) {
      result = await updateSchemaProfileAPI(editedItem?.id, data);
    } else {
      result = await createSchemaProfileAPI(data);
    }
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      setEditedItem(null);
      onClose();
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
    }
  };

  const buttonState =
    schemaName === '' || Object.values(selectedValues)?.length <= 0;

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
      <PopoverBody
        style={{
          padding:
            'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
        }}
      >
        <Flex direction="column" gap={16}>
          <Input
            label={__('Schema preset name', 'kirki-ecommerce')}
            placeholder={__('e.g General', 'kirki-ecommerce')}
            value={schemaName}
            onChange={(value) => {
              setSchemaName(String(value));
              setErrors({ name: '' });
            }}
            error={errors['name'] as string | boolean | undefined}
          />
          <GroupTagTable
            groupDetails={groupDetails}
            selectedValues={selectedValues}
            optionsArray={optionsList as SelectOption[]}
            requiredFields={requiredFields}
            onChange={(value) =>
              handleOnSelectionChange(
                value as Record<string, string[]>,
              )
            }
            hasSelect
            isEditable
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
            onClick={handleAddOrUpdateSchema}
            state={buttonState ? 'disabled' : ''}
          />
        </ActionGroup>
      </PopoverFooter>
    </Popover>
  );
};

export default AddSchemaPopup;
