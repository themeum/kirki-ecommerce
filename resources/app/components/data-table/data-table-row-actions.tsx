import { Edit3 } from 'lucide-react';
import { useState } from 'react';

import type { DataTableRowActionsConfig } from '@/components/data-table/types';
import DropdownButton from '@/components/dropdown-button';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { theme } from '@/theme';
import { __ } from '@/wpi18n';

const DataTableRowActions = ({ edit, actions = [], actionCssOverride }: DataTableRowActionsConfig) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!edit && actions.length === 0) {
    return null;
  }

  return (
    <ActionGroup cssOverride={{ visibility: isOpen ? 'visible' : undefined }}>
      {edit && (
        <Button
          variant="secondary"
          size="icon"
          cssOverride={edit.cssOverride}
          aria-label={edit.label ?? __('Edit', 'kirki-ecommerce')}
          onClick={edit.onClick}
        >
          <Edit3 size={12} />
        </Button>
      )}

      {actions.length > 0 && (
        <DropdownButton
          buttonProps={{
            variant: 'secondary',
            cssOverride: actionCssOverride,
          }}
          options={actions.map((action, index) =>
            'type' in action && action.type === 'separator'
              ? { value: `separator-${index}`, title: '', type: 'separator' as const }
              : {
                value: index,
                title: action.label,
                icon: action.icon,
                style: {
                  ...(action.destructive ? { color: theme.colors.text.critical } : {}),
                  ...action.cssOverride,
                },
              },
          )}
          onOptionSelect={(actionIndex) => {
            const action = actions[Number(actionIndex)];
            if (action?.onClick) {
              action.onClick();
            }
          }}
          onOptionToggle={setIsOpen}
        />
      )}
    </ActionGroup>
  );
};

DataTableRowActions.displayName = 'DataTableRowActions';

export default DataTableRowActions;
