import type { ColumnDef } from '@tanstack/react-table';

import Thumbnail from '@/components/ui/thumbnail';
import type { Brand } from '@/features/brands/schemas/catalog/brand';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const styles = defineStyles({
  descriptionCell: {
    maxWidth: '240px',
  },
});

const brandColumns: ColumnDef<Brand>[] = [
  {
    id: 'name',
    header: __('Name', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => row.original?.name || '--',
  },
  {
    id: 'logo',
    header: __('Image', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => {
      const logo = row.original?.logo && typeof row.original.logo === 'object' ? row.original.logo : null;
      return <Thumbnail src={logo?.url} style={{ height: '48px', width: '48px' }} />;
    },
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

export { brandColumns };
