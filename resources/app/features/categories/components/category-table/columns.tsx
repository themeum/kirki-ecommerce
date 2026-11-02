import type { ColumnDef } from '@tanstack/react-table';

import Image from '@/components/ui/image';
import type { Category } from '@/features/categories/schemas/catalog/category';
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

type CategoryColumnsOptions = {
  onEdit: (category: Category) => void;
};

const createCategoryColumns = ({ onEdit }: CategoryColumnsOptions): ColumnDef<Category>[] => [
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
    id: 'image',
    header: __('Image', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => {
      const image = row.original?.image && typeof row.original.image === 'object' ? row.original.image : null;
      return <Image src={image} width={48} height={48} />;
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

export { createCategoryColumns };
