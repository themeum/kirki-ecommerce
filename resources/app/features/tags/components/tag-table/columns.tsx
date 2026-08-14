import type { ColumnDef } from '@tanstack/react-table';

import type { Tag } from '@/features/tags/schemas/catalog/tag';
import { __ } from '@/wpi18n';

const tagColumns: ColumnDef<Tag>[] = [
  {
    id: 'name',
    header: __('Name', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => row.original?.name || '--',
  },
  {
    id: 'description',
    header: __('Description', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => row.original?.description || '--',
  },
  {
    id: 'slug',
    header: __('Slug', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => row.original?.slug || '--',
  },
  {
    id: 'count',
    header: __('Count', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => row.original?.count ?? 0,
  },
];

export { tagColumns };
