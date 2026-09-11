import { PlusCircle } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import Button from '@/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import Searchbox from '@/components/ui/searchbox';
import Text from '@/components/ui/text';
import { CustomerProfileCard, useCustomersQuery } from '@/features/customers';
import CustomerSearchSkeleton from '@/features/customers/skeletons/customer-search-skeleton';
import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type CustomerSearchDropdownProps = {
  onSelect: (customerId: number) => void;
  onOpenAddDialog: (searchText: string) => void;
};

const CustomerSearchDropdown = ({ onSelect, onOpenAddDialog }: CustomerSearchDropdownProps) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const query = search.trim();
  const { data, isFetching } = useCustomersQuery({ search: query, limit: 10 }, open);

  const customers = useMemo(() => {
    if (!isDefined(data?.results)) {
      return [];
    }

    return data.results;
  }, [data]);

  const handleSelect = (customerId: number) => {
    onSelect(customerId);
    setOpen(false);
    setSearch('');
  };

  const handleAdd = () => {
    onOpenAddDialog(search);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={anchorRef}>
          <Searchbox
            placeholder={__('Search or add a customer', 'kirki-ecommerce')}
            onClick={() => setOpen(true)}
            onChange={(value) => {
              setSearch(String(value));
              setOpen(true);
            }}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) {
            event.preventDefault();
          }
        }}
        cssOverride={{ width: '320px' }}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {customers.length === 0 && isFetching && <CustomerSearchSkeleton />}
            {customers.length === 0 && !isFetching && (
              <Text variant="small" color="secondary" cssOverride={styles.status}>
                {__('No customers found.', 'kirki-ecommerce')}
              </Text>
            )}
            {customers.length > 0 && (
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={String(customer.id)}
                    onSelect={() => handleSelect(customer.id)}
                  >
                    <CustomerProfileCard
                      name={[customer.first_name, customer.last_name].filter(Boolean).join(' ')}
                      email={customer.email}
                      phone={customer.phone}
                      photo={customer.photo}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
        <div css={scopedMerge(styles.footer, styles.footerBordered)}>
          <Button variant="ghost" cssOverride={styles.addButton} onClick={handleAdd}>
            <PlusCircle />
            <Text variant="tiny" weight="medium">
              {__('Add new', 'kirki-ecommerce')}
            </Text>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

CustomerSearchDropdown.displayName = 'CustomerSearchDropdown';

export default CustomerSearchDropdown;

const styles = defineStyles({
  status: {
    padding: `${theme.spacing[4]} ${theme.spacing[2]}`,
    textAlign: 'center',
  },
  footer: {
    marginLeft: `-${theme.spacing[3]}`,
    marginRight: `-${theme.spacing[3]}`,
    paddingLeft: theme.spacing[3],
    paddingRight: theme.spacing[3],
    paddingTop: theme.spacing[3],
  },
  footerBordered: {
    borderTop: `1px solid ${theme.colors.border.default}`,
  },
  addButton: {
    width: '100%',
    justifyContent: 'flex-start',
    padding: `0 ${theme.spacing[2]}`,
  },
});
