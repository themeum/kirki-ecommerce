import { useEffect } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Image from '@/components/ui/image';
import { PopoverAnchor } from '@/components/ui/popover';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItemTitle,
  useStackedItem,
} from '@/components/ui/stacked-items';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import ShippingCarrierPopover from '@/features/settings/shipping/pages/shipping-carrier/shipping-carrier-popover';
import type { ShippingCarrier } from '@/features/settings/shipping/schemas/catalog/shipping';
import type { ShippingCarrierFormPayload } from '@/features/settings/shipping/schemas/forms/shipping-carrier-form';
import { EditPenIcon, TrashIcon, TruckIcon } from '@/icons/common';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const LOGO_SIZE = 20;

type ShippingCarrierRowProps = {
  carrier: ShippingCarrier;
  isEditing: boolean;
  onEdit: (carrier: ShippingCarrier) => void;
  onCloseEdit: () => void;
  onSubmit: (carrier: ShippingCarrier, payload: ShippingCarrierFormPayload) => void;
  onToggle: (carrier: ShippingCarrier) => void;
  onDelete: (carrier: ShippingCarrier) => void;
};

type ShippingCarrierRowActionsProps = ShippingCarrierRowProps;

const ShippingCarrierRowActions = ({
  carrier,
  isEditing,
  onEdit,
  onCloseEdit,
  onSubmit,
  onToggle,
  onDelete,
}: ShippingCarrierRowActionsProps) => {
  const { setOpen } = useStackedItem();

  useEffect(() => {
    setOpen(isEditing);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOpen is recreated on every render
  }, [isEditing]);

  return (
    <ActionGroup>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={__('Delete', 'kirki-ecommerce')}
        cssOverride={styles.actionButton}
        onClick={() => onDelete(carrier)}
      >
        <TrashIcon />
      </Button>
      <ShippingCarrierPopover
        isOpen={isEditing}
        selectedCarrier={carrier}
        onClose={onCloseEdit}
        onSubmit={(payload) => onSubmit(carrier, payload)}
      >
        <PopoverAnchor asChild>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={__('Edit', 'kirki-ecommerce')}
            cssOverride={styles.actionButton}
            onClick={() => onEdit(carrier)}
          >
            <EditPenIcon />
          </Button>
        </PopoverAnchor>
      </ShippingCarrierPopover>
      <Switch
        checked={carrier.is_enabled ?? false}
        onCheckedChange={() => onToggle(carrier)}
        aria-label={__('Enable shipping carrier', 'kirki-ecommerce')}
      />
    </ActionGroup>
  );
};

ShippingCarrierRowActions.displayName = 'ShippingCarrierRowActions';

const ShippingCarrierRow = (props: ShippingCarrierRowProps) => {
  const { carrier } = props;

  return (
    <StackedItem id={carrier.id}>
      <StackedItemMedia>
        {carrier.logo_url ? (
          <Image src={carrier.logo_url} alt="" width={LOGO_SIZE} height={LOGO_SIZE} fit="contain" />
        ) : (
          <TruckIcon />
        )}
      </StackedItemMedia>
      <StackedItemContent>
        <StackedItemTitle>
          <Text variant="small" weight="medium">
            {carrier.name ?? ''}
          </Text>
          {!carrier.is_enabled && <Badge size="sm">{__('Inactive', 'kirki-ecommerce')}</Badge>}
        </StackedItemTitle>
      </StackedItemContent>
      <StackedItemActions>
        <ShippingCarrierRowActions {...props} />
      </StackedItemActions>
    </StackedItem>
  );
};

ShippingCarrierRow.displayName = 'ShippingCarrierRow';

export default ShippingCarrierRow;

const styles = defineStyles({
  actionButton: {
    padding: theme.spacing[1],
  },
});
