import ActionGroup from '@/components/ui/action-group';
import { EditIcon, TrashIcon } from '@/icons';
import { __ } from '@/wpi18n';
import { useNavigate, useOutletContext } from 'react-router';

import Button from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Switch from '@/components/ui/switch';
import type { ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import { theme } from '@/theme';
import { MoreVertical } from 'lucide-react';

type SettingsOutletContext = {
  confirmAction: (opts: {
    action: () => void;
    otherProps?: Record<string, unknown>;
  }) => void;
};

type ShippingZoneActionsProps = {
  item: ShippingZone;
  onToggle: (item: ShippingZone) => void;
  onDelete: (item: ShippingZone) => void;
};

const ShippingZoneActions = ({
  item,
  onToggle,
  onDelete,
}: ShippingZoneActionsProps) => {
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const navigate = useNavigate();

  const handleEditAndDelete = (action: string, item: ShippingZone) => {
    if (action === 'edit') {
      confirmAction({
        action: () => navigate(`/settings/shipping/zone/${item.id}`),
      });
    } else {
      setUnsavedDataStatus(true);
      confirmAction({
        action: () => onDelete(item),
        otherProps: {
          variant: 'delete',
          force: true,
          title: __('Delete shipping zone?', 'kirki-ecommerce'),
          subtitle: __(
            'Are you sure you want to delete this zone? This action cannot be undone.',
            'kirki-ecommerce',
          ),
        },
      });
    }
  };
  return (
    <ActionGroup gap={2} cssOverride={{ marginLeft: theme.spacing[2] }}>
      <Switch checked={item?.is_enabled} onCheckedChange={() => onToggle(item)} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            cssOverride={{ '& svg': { width: 16, height: 16 } }}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleEditAndDelete('edit', item)}>
            <EditIcon />
            <span>{__('Edit', 'kirki-ecommerce')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleEditAndDelete('delete', item)}>
            <TrashIcon />
            <span>{__('Delete', 'kirki-ecommerce')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ActionGroup>
  );
};

ShippingZoneActions.displayName = 'ShippingZoneActions';

export default ShippingZoneActions;

