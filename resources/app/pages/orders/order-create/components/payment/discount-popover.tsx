import { type ReactNode, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import Button from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { OrderFormInput } from '@/types';
import { __ } from '@/wpi18n';

type DiscountPopoverProps = {
  children: ReactNode;
};

const DiscountPopover = ({ children }: DiscountPopoverProps) => {
  const { getValues, setValue } = useFormContext<OrderFormInput>();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(getValues('coupon_code') ?? '');

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(getValues('coupon_code') ?? '');
    }

    setOpen(next);
  };

  const handleDiscard = () => {
    setDraft(getValues('coupon_code') ?? '');
    setOpen(false);
  };

  const handleConfirm = () => {
    setValue('coupon_code', draft.trim() || null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" cssOverride={styles.content}>
        <Flex direction="column" gap={4}>
          <Flex direction="column" gap={2}>
            <FieldLabel htmlFor="coupon_code">
              {__('Apply a coupon code', 'kirki-ecommerce')}
            </FieldLabel>
            <Input
              id="coupon_code"
              value={draft}
              placeholder={__('Enter coupon code', 'kirki-ecommerce')}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Flex>
          <Flex gap={2} justify="flex-end">
            <Button variant="ghost" onClick={handleDiscard}>
              {__('Discard', 'kirki-ecommerce')}
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              {__('Confirm', 'kirki-ecommerce')}
            </Button>
          </Flex>
        </Flex>
      </PopoverContent>
    </Popover>
  );
};

DiscountPopover.displayName = 'DiscountPopover';

export default DiscountPopover;

const styles = defineStyles({
  content: {
    width: '280px',
    padding: theme.spacing[4],
  },
});
