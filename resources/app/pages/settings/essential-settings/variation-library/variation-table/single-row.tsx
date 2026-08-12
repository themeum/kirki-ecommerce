import { format } from 'date-fns';
import { Edit3, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import type { Attribute, AttributeValue } from '@/features/products';
import { useDeleteAttributeValueMutation } from '@/features/products';
import { DATE_FORMATS } from '@/libs/date';
import VariationValuePopup from '@/pages/settings/essential-settings/variation-library/variation-value-dialog';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { ConfirmationVariant } from '@/types/components/common';
import type { MarkListHandlers } from '@/types/pages/common';
import { __ } from '@/wpi18n';

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
    if (!selectedItem) {
      return;
    }
    deleteMutation.mutate({
      attribute_id: selectedItem.id,
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
                css={scoped({
                  height: 32,
                  width: 32,
                  minWidth: 32,
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.border.default}`,
                  backgroundColor: `${item?.color ?? 'transparent'}`,
                })}
              />
            )}
            {item?.value}
          </Flex>
        </TableCell>

        {selectedItem?.type === 'color' && <TableCell>{item?.color}</TableCell>}
        <TableCell>{selectedItem?.updated_at ? format(selectedItem.updated_at, DATE_FORMATS.HUMAN_READABLE) : '--'}</TableCell>
        <TableCell alignment="right">
          <ActionGroup>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleAttributeValueRemove}
            >
              <Trash2 />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setEditedItem(item)}
            >
              <Edit3 />
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
