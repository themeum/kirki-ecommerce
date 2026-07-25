import { useState } from 'react';
import { useOutletContext } from 'react-router';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import { useDeleteAttributeValueMutation } from '@/services/attribute';
import type {
  Attribute,
  AttributeValue,
  ConfirmationVariant,
  MarkListHandlers,
} from '@/types';
import { theme } from '@/theme';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import VariationValuePopup from '@/pages/settings/essential-settings/variation-library/variation-value-dialog';

type AttributeWithMeta = Attribute & { updated_at?: string };

type SettingsOutletContext = {
  confirmAction: (params: {
    action?: () => void;
    otherProps?: {
      variant?: ConfirmationVariant;
      force?: boolean;
      title?: string;
      subtitle?: string;
    };
  }) => void;
};

type SingleRowProps = MarkListHandlers & {
  item: AttributeValue;
  selectedItem?: AttributeWithMeta;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
  selectedItem,
}: SingleRowProps) => {
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const [editedItem, setEditedItem] = useState<AttributeValue | null>(null);
  const deleteMutation = useDeleteAttributeValueMutation();

  const handleAttributeValueRemove = () => {
    setUnsavedDataStatus(true);
    confirmAction({
      action: () => onDeleteValue(),
      otherProps: {
        variant: 'delete',
        force: true,
        title: __('Delete attribute value?', 'kirki-ecommerce'),
        subtitle: __(
          'Are you sure you want to delete this value? This action cannot be undone.',
          'kirki-ecommerce',
        ),
      },
    });
  };

  const onDeleteValue = () => {
    deleteMutation.mutate({
      attribute_id: selectedItem?.id as number,
      value_id: item?.id,
    });
  };

  return (
    <>
      <TableRow key={item.id}>
        <TableCell onlyCheckbox>
          <Checkbox
            checked={isSelected(item.id)}
            onCheckedChange={(value) =>
              handleSingleCheckboxClick(value, item.id)
            }
          />
        </TableCell>
        <TableCell>
          <Flex gap={3} align="center">
            {selectedItem?.type === 'color' && (
              <div
                style={{
                  height: '32px',
                  width: '32px',
                  minWidth: '32px',
                  borderRadius: theme.radius.md,
                  border: `1.17px solid ${theme.colors.border.default}`,
                  background: `${item?.color}`,
                }}
              ></div>
            )}
            {item?.value}
          </Flex>
        </TableCell>

        {selectedItem?.type === 'color' && <TableCell>{item?.color}</TableCell>}
        <TableCell>{selectedItem?.updated_at}</TableCell>
        <TableCell alignment="right" style={{ width: '1%' }}>
          <ActionGroup>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleAttributeValueRemove}
            >
              <TrashIcon />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setEditedItem(item)}
            >
              <EditPenIcon />
            </Button>
          </ActionGroup>
        </TableCell>
      </TableRow>
      {editedItem && (
        <VariationValuePopup
          isOpen={Boolean(editedItem)}
          onClose={() => setEditedItem(null)}
          editedItem={editedItem}
          type={selectedItem?.type}
          selectedItem={selectedItem}
        />
      )}
    </>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;
