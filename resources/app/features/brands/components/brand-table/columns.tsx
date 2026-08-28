import type { ColumnDef } from '@tanstack/react-table';

import Image from '@/components/ui/image';
import type { Brand } from '@/features/brands/schemas/catalog/brand';
import { __ } from '@/wpi18n';

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
      return <Image src={logo} width={48} height={48} />;
    },
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

export { brandColumns };
