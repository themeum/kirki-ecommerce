import type { ColumnDef } from '@tanstack/react-table';

import Thumbnail from '@/components/ui/thumbnail';
import type { Category } from '@/features/categories/schemas/catalog/category';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const styles = defineStyles({
  descriptionCell: {
    maxWidth: '240px',
  },
});

const categoryColumns: ColumnDef<Category>[] = [
  {
    id: 'name',
    header: __('Name', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => row.original?.name || '--',
  },
  {
    id: 'image',
    header: __('Image', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => {
      const image = row.original?.image && typeof row.original.image === 'object' ? row.original.image : null;
      return <Thumbnail src={image?.url} style={{ height: '48px', width: '48px' }} />;
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

export { categoryColumns };
