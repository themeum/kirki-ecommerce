import type { ColumnDef } from '@tanstack/react-table';

import DataTable from '@/components/data-table';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownUp, ListFilter } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { SelectOption } from '@/types/components/common';
import { __ } from '@/wpi18n';

/**
 * Static placeholder rows — customer groups has no backend yet. Swap this
 * array for a query once the API exists; nothing else about this table
 * should need to change.
 */
type MockCustomerGroup = {
  id: number;
  name: string;
  members: number;
  tag: string;
  createdOn: string;
};

const mockCustomerGroups: MockCustomerGroup[] = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  name: 'Wholesale Partners',
  members: 12,
  tag: 'Wholesale',
  createdOn: '2025/04/09',
}));

const customerGroupColumns: ColumnDef<MockCustomerGroup>[] = [
  {
    id: 'name',
    header: __('Group Name', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original.name,
  },
  {
    id: 'members',
    header: __('Members', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original.members,
  },
  {
    id: 'tag',
    header: __('Tags', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => <Badge variant="warning">{row.original.tag}</Badge>,
  },
  {
    id: 'createdOn',
    header: __('Created On', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original.createdOn,
  },
];

const groupFilterOptions: SelectOption[] = [
  { value: 'all', title: __('All Groups', 'kirki-ecommerce') },
  { value: 'new', title: __('New Groups', 'kirki-ecommerce') },
  { value: 'top', title: __('Top Groups', 'kirki-ecommerce') },
];

const CustomerGroupTableFilters = () => (
  <Flex cssOverride={styles.wrapper}>
    <Select defaultValue="all">
      <SelectTrigger variant="secondary">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {groupFilterOptions.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <ActionGroup>
      <Select disabled>
        <SelectTrigger cssOverride={styles.selectTrigger}>
          <SelectValue placeholder="Date: This Month" />
        </SelectTrigger>
        <SelectContent />
      </Select>
      <Button variant="outline">
        <ListFilter />
        Filter
      </Button>
      <Button variant="outline" aria-label="Sort">
        <ArrowDownUp />
      </Button>
      <Input placeholder="Search" />
    </ActionGroup>
  </Flex>
);

CustomerGroupTableFilters.displayName = 'CustomerGroupTableFilters';

const CustomerGroupTable = () => (
  <DataTable
    data={mockCustomerGroups}
    columns={customerGroupColumns}
    pageCount={1}
    pagination={{ pageIndex: 0, pageSize: mockCustomerGroups.length }}
    onPaginationChange={() => undefined}
    sorting={[]}
    onSortingChange={() => undefined}
    hidePagination
    density="wide"
    enableRowSelection
    toolbar={<CustomerGroupTableFilters />}
  />
);

CustomerGroupTable.displayName = 'CustomerGroupTable';

export default CustomerGroupTable;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
  selectTrigger: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
});
