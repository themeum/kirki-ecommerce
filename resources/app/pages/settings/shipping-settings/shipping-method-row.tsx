import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { EditPenIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import type { ShippingMethodData } from '@/pages/settings/shipping-settings/utils';

type ShippingMethodRowProps = {
  method: ShippingMethodData;
  onToggle: (method: ShippingMethodData) => void;
  onEdit: (method: ShippingMethodData) => void;
  onDelete: (method: ShippingMethodData) => void;
};

const ShippingMethodRow = (props: ShippingMethodRowProps) => {
  const { method, onToggle, onEdit, onDelete } = props;

  const isEnabled = method.is_enabled ?? true;

  return (
    <Item
      size="sm"
      cssOverride={styles.row}
      data-inactive={isEnabled ? undefined : 'true'}
    >
      <ItemMedia>{method.icon}</ItemMedia>
      <ItemContent>
        <ItemTitle>
          <Text variant="small" weight="medium" data-dimmed="true">
            {method.name}
          </Text>
          {method.subText && (
            <Text variant="small" color="subdued" data-dimmed="true">
              {method.subText}
            </Text>
          )}
          {!isEnabled && (
            <Badge variant="destructive" cssOverride={styles.badge}>
              {__('Inactive', 'kirki-ecommerce')}
            </Badge>
          )}
        </ItemTitle>
      </ItemContent>
      <ItemActions>
        {method.rightText && (
          <Text
            variant="small"
            color="secondary"
            data-dimmed="true"
            data-price="true"
          >
            {method.rightText}
          </Text>
        )}
        <ActionGroup>
          <Switch
            checked={isEnabled}
            onCheckedChange={() => onToggle(method)}
            aria-label={__('Enable shipping method', 'kirki-ecommerce')}
          />
          <Button
            variant="secondary"
            size="icon"
            aria-label={__('Delete', 'kirki-ecommerce')}
            cssOverride={styles.actionButton}
            onClick={() => onDelete(method)}
          >
            <TrashIcon />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={__('Edit', 'kirki-ecommerce')}
            cssOverride={styles.actionButton}
            onClick={() => onEdit(method)}
          >
            <EditPenIcon />
          </Button>
        </ActionGroup>
      </ItemActions>
    </Item>
  );
};

ShippingMethodRow.displayName = 'ShippingMethodRow';

export default ShippingMethodRow;

const styles = defineStyles({
  row: {
    position: 'relative',
    '& [data-action-group="true"]': {
      position: 'absolute',
      right: theme.spacing[4],
      top: '50%',
      transform: 'translateY(-50%)',
      opacity: 0,
      pointerEvents: 'none',
    },
    '&:hover [data-action-group="true"], &:focus-within [data-action-group="true"]': {
      opacity: 1,
      pointerEvents: 'auto',
    },
    '&:hover [data-price="true"], &:focus-within [data-price="true"]': {
      visibility: 'hidden',
    },
    '&[data-inactive="true"] [data-slot="item-media"], &[data-inactive="true"] [data-dimmed="true"]':
    {
      opacity: 0.5,
    },
  },
  badge: {
    height: theme.spacing[5],
    padding: `${theme.spacing[0]} ${theme.spacing[2]}`,
  },
  actionButton: {
    padding: theme.spacing[1],
  },
});
