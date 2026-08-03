import { useState, type ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

import Button from '@/components/ui/button';
import { FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShippingProfilesQuery } from '@/services/shipping';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { OrderFormInput } from '@/types';
import { __ } from '@/wpi18n';

type ShippingPopoverProps = {
  children: ReactNode;
};

const ShippingPopover = ({ children }: ShippingPopoverProps) => {
  const { getValues, setValue, formState } = useFormContext<OrderFormInput>();
  const error = formState.errors.shipping_method;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(getValues('shipping_method') ?? '');

  const { data: shippingProfiles = [], isLoading } = useShippingProfilesQuery({}, open);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(getValues('shipping_method') ?? '');
    }

    setOpen(next);
  };

  const handleDiscard = () => {
    setDraft(getValues('shipping_method') ?? '');
    setOpen(false);
  };

  const handleConfirm = () => {
    setValue('shipping_method', draft || null, { shouldValidate: true });
    setOpen(false);
  };

  return (
    <Flex direction="column" gap={1}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent align="start" cssOverride={styles.content}>
          <Flex direction="column" gap={4}>
            <Flex direction="column" gap={2}>
              <FieldLabel htmlFor="shipping_method">
                {__('Choose your delivery method', 'kirki-ecommerce')}
              </FieldLabel>
              <Select value={draft} onValueChange={setDraft} disabled={isLoading}>
                <SelectTrigger id="shipping_method">
                  <SelectValue placeholder={__('Pick an option', 'kirki-ecommerce')} />
                </SelectTrigger>
                <SelectContent>
                  {shippingProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.name}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Flex>
            <Flex gap={2} justify="flex-end">
              <Button variant="ghost" onClick={handleDiscard}>
                {__('Discard', 'kirki-ecommerce')}
              </Button>
              <Button variant="primary" onClick={handleConfirm} disabled={!draft}>
                {__('Confirm', 'kirki-ecommerce')}
              </Button>
            </Flex>
          </Flex>
        </PopoverContent>
      </Popover>
      {error && <FieldError errors={[error]} />}
    </Flex>
  );
};

ShippingPopover.displayName = 'ShippingPopover';

export default ShippingPopover;

const styles = defineStyles({
  content: {
    width: '280px',
    padding: theme.spacing[4]
  },
});
