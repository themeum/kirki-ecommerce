import type { ColumnDef } from '@tanstack/react-table';

import type { Tag } from '@/features/tags/schemas/catalog/tag';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const styles = defineStyles({
  descriptionCell: {
    maxWidth: '240px',
  },
});

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
    meta: { cssOverride: styles.descriptionCell },
    cell: ({ row }) => {
      const description = row.original?.description;
      return <span title={description || undefined}>{description || '--'}</span>;
    },
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
