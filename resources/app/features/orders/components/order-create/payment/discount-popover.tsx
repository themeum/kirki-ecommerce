import { Command as CommandPrimitive } from 'cmdk';
import { Check, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Button from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import InfiniteScrollSentinel from '@/components/ui/infinite-scroll-sentinel';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import { useInfiniteCouponsQuery } from '@/features/coupons/services/coupon';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import useDebounce from '@/hooks/use-debounce';
import { theme } from '@/theme';
import { defineStyles, scoped, uiFocusRing } from '@/theme/mixins';
import { displayMoney } from '@/utils/money';
import { __, sprintf } from '@/wpi18n';

const PAGE_SIZE = 20;

type SelectedCoupon = NonNullable<OrderFormInput['coupon_codes']>[number];

type DiscountPopoverProps = {
  children: ReactNode;
};

const getCouponSubtitle = (coupon: SelectedCoupon) => {
  if (coupon.discount_type === 'free-shipping') {
    return __('Free shipping', 'kirki-ecommerce');
  }

  if (coupon.discount_type === 'buy-x-get-y') {
    return coupon.title;
  }

  const amount =
    coupon.discount_value_type === 'percentage'
      ? `${coupon.base_discount_amount}%`
      : displayMoney('base_discount_amount', coupon);

  const scope =
    coupon.discount_target === 'products'
      ? __('selected products', 'kirki-ecommerce')
      : __('entire order', 'kirki-ecommerce');

  return sprintf(
    /* translators: %1$s: amount, %2$s: scope */
    __('%1$s off %2$s', 'kirki-ecommerce'),
    amount,
    scope,
  );
};

const DiscountPopover = ({ children }: DiscountPopoverProps) => {
  const { setValue, control } = useFormContext<OrderFormInput>();
  const selectedCoupons = useWatch({ control, name: 'coupon_codes' });

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SelectedCoupon[]>([]);
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteCouponsQuery({
      limit: PAGE_SIZE,
      search: debouncedSearch,
      method: 'code',
    });

  const options = data?.pages.flatMap((page) => page.results) ?? [];
  const selectedCodes = new Set(draft.map((coupon) => coupon.code));

  useEffect(() => {
    setDraft(selectedCoupons ?? []);
  }, [selectedCoupons]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(selectedCoupons ?? []);
      setSearch('');
    }

    setIsDropdownOpen(false);
    setOpen(next);
  };

  const handleDiscard = () => {
    setDraft(selectedCoupons ?? []);
    setOpen(false);
  };

  const handleConfirm = () => {
    setValue('coupon_codes', draft);
    setOpen(false);
  };

  const handleToggle = (coupon: SelectedCoupon) => {
    if (selectedCodes.has(coupon.code)) {
      setDraft(draft.filter((item) => item.code !== coupon.code));
      return;
    }

    setDraft([...draft, coupon]);
    setSearch('');
    setIsDropdownOpen(false);
  };

  const handleRemove = (coupon: SelectedCoupon) => {
    setDraft(draft.filter((item) => item.code !== coupon.code));
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        cssOverride={styles.content}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Flex direction="column" gap={3}>
          <FieldLabel>
            <Text variant="heading6" weight="semibold">
              {__('Edit discount', 'kirki-ecommerce')}
            </Text>
          </FieldLabel>

          <Command shouldFilter={false} cssOverride={styles.command}>
            <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <PopoverAnchor asChild>
                <CommandPrimitive.Input
                  ref={inputRef}
                  value={search}
                  placeholder={__('Enter a discount code', 'kirki-ecommerce')}
                  css={scoped(styles.searchInput)}
                  onValueChange={(value) => {
                    setSearch(value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                />
              </PopoverAnchor>
              <PopoverContent
                align="start"
                sideOffset={4}
                cssOverride={styles.dropdown}
                onOpenAutoFocus={(event) => event.preventDefault()}
                onCloseAutoFocus={(event) => event.preventDefault()}
                onInteractOutside={(event) => {
                  if (inputRef.current?.contains(event.target as Node)) {
                    event.preventDefault();
                  }
                }}
              >
                <CommandList>
                  {isLoading && <CommandEmpty>{__('Searching..', 'kirki-ecommerce')}</CommandEmpty>}
                  {!isLoading && options.length === 0 && (
                    <CommandEmpty>{__('No coupons found.', 'kirki-ecommerce')}</CommandEmpty>
                  )}
                  <CommandGroup>
                    {options.map((coupon) => {
                      const isSelected = selectedCodes.has(coupon.code);

                      return (
                        <CommandItem
                          key={coupon.id}
                          value={String(coupon.id)}
                          onSelect={() => handleToggle(coupon)}
                        >
                          <Flex justify="space-between" align="center" grow={1}>
                            <Flex direction="column">
                              <Text variant="small" weight="medium">
                                {coupon.code ?? coupon.title}
                              </Text>
                              <Text variant="tiny" color="secondary">
                                {getCouponSubtitle(coupon)}
                              </Text>
                            </Flex>
                            {isSelected && <Check size={14} aria-hidden="true" />}
                          </Flex>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <InfiniteScrollSentinel
                    hasMore={Boolean(hasNextPage)}
                    isLoading={isFetchingNextPage}
                    onLoadMore={() => void fetchNextPage()}
                  />
                </CommandList>
              </PopoverContent>
            </Popover>
          </Command>

          {draft.length > 0 && (
            <Flex direction="column" cssOverride={styles.appliedList}>
              {draft.map((coupon) => (
                <Flex
                  key={coupon.id}
                  justify="space-between"
                  align="center"
                  cssOverride={styles.appliedRow}
                >
                  <Flex direction="column">
                    <Text variant="small" weight="medium">
                      {coupon.title ?? coupon.code}
                    </Text>
                    <Text variant="tiny" color="secondary">
                      {getCouponSubtitle(coupon)}
                    </Text>
                  </Flex>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleRemove(coupon)}
                    aria-label={__('Remove coupon', 'kirki-ecommerce')}
                  >
                    <X size={16} />
                  </Button>
                </Flex>
              ))}
            </Flex>
          )}

          <Separator marginTop={0} marginBottom={0} cssOverride={{ width: '100%' }} />

          <Flex gap={2} justify="flex-end">
            <Button variant="outline" onClick={handleDiscard}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              {__('Save', 'kirki-ecommerce')}
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
    minWidth: '334px',
    maxWidth: '334px',
    padding: theme.spacing[4],
  },
  command: {
    overflow: 'visible',
    backgroundColor: 'transparent',
    borderRadius: theme.radius.none,
  },
  searchInput: {
    width: '100%',
    minHeight: '28px',
    margin: 0,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    outline: 'none',
    ...theme.typography.small('medium'),
    color: theme.colors.text.primary,
    '&::placeholder': {
      color: theme.colors.text.subdued,
      opacity: 0.8,
    },
    '&:focus': {
      border: `1px solid ${theme.colors.border.secondary}`,
      ...uiFocusRing(theme),
    },
  },
  dropdown: {
    minWidth: 'var(--radix-popover-trigger-width)',
    maxWidth: 'none',
    padding: 0,
    overflow: 'hidden',
  },
  appliedList: {
    maxHeight: '240px',
    overflowY: 'auto',
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
  },
  appliedRow: {
    padding: theme.spacing[3],
    '&:not(:last-of-type)': {
      borderBottom: `1px solid ${theme.colors.border.default}`,
    },
  },
});
