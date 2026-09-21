import type { ColumnDef } from '@tanstack/react-table';

import Image from '@/components/ui/image';
import type { Brand } from '@/features/brands/schemas/catalog/brand';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const styles = defineStyles({
  descriptionCell: {
    maxWidth: '240px',
  },
  clickable: {
    padding: 0,
    border: 'none',
    background: 'none',
    font: 'inherit',
    color: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
});

type BrandColumnsOptions = {
  onEdit: (brand: Brand) => void;
};

const createBrandColumns = ({ onEdit }: BrandColumnsOptions): ColumnDef<Brand>[] => [
  {
    id: 'name',
    header: __('Name', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => (
      <button type="button" css={scoped(styles.clickable)} onClick={() => onEdit(row.original)}>
        {row.original?.name || '--'}
      </button>
    ),
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
    enableSorting: false,
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

export { createBrandColumns };
