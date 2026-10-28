import { PlusIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import Button from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from '@/components/ui/image';
import { PopoverAnchor } from '@/components/ui/popover';
import ShippingCarrierPopover from '@/features/settings/shipping/pages/shipping-carrier/shipping-carrier-popover';
import type { ShippingCarrierPreset } from '@/features/settings/shipping/schemas/catalog/shipping';
import type { ShippingCarrierFormPayload } from '@/features/settings/shipping/schemas/forms/shipping-carrier-form';
import { TruckIcon } from '@/icons/common';
import { theme } from '@/theme';
import { __ } from '@/wpi18n';

const LOGO_SIZE = 16;

type ShippingCarrierAddMenuProps = {
  presets: ShippingCarrierPreset[];
  onSelectPreset: (preset: ShippingCarrierPreset) => void;
  onSubmitNew: (payload: ShippingCarrierFormPayload) => void;
};

const ShippingCarrierAddMenu = ({
  presets,
  onSelectPreset,
  onSubmitNew,
}: ShippingCarrierAddMenuProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const isFormPendingRef = useRef(false);

  /**
   * The menu hands focus back to the trigger as it unmounts, and that lands
   * outside the popover — enough to dismiss it had it opened alongside the
   * menu. Opening a tick after the menu has released focus keeps the two
   * layers from overlapping at all.
   */
  const handleMenuCloseAutoFocus = () => {
    if (!isFormPendingRef.current) {
      return;
    }

    isFormPendingRef.current = false;

    window.setTimeout(() => setIsFormOpen(true), 0);
  };

  return (
    <ShippingCarrierPopover
      isOpen={isFormOpen}
      onClose={() => setIsFormOpen(false)}
      onSubmit={onSubmitNew}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <PopoverAnchor asChild>
            <Button
              variant="secondary"
              size="sm"
              cssOverride={{ color: theme.colors.text.emphasis }}
            >
              <PlusIcon />
              {__('Add', 'kirki-ecommerce')}
            </Button>
          </PopoverAnchor>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={handleMenuCloseAutoFocus}>
          {presets.map((preset) => (
            <DropdownMenuItem key={preset.key} onSelect={() => onSelectPreset(preset)}>
              {preset.logo_url ? (
                <Image
                  src={preset.logo_url}
                  alt=""
                  width={LOGO_SIZE}
                  height={LOGO_SIZE}
                  fit="contain"
                />
              ) : (
                <TruckIcon />
              )}
              {preset.name}
            </DropdownMenuItem>
          ))}
          {presets.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            onSelect={() => {
              isFormPendingRef.current = true;
            }}
          >
            <PlusIcon size={16} />
            {__('Add new', 'kirki-ecommerce')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ShippingCarrierPopover>
  );
};

ShippingCarrierAddMenu.displayName = 'ShippingCarrierAddMenu';

export default ShippingCarrierAddMenu;
