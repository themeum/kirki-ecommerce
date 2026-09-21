import type { ColumnDef } from '@tanstack/react-table';

import type { Tag } from '@/features/tags/schemas/catalog/tag';
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

type TagColumnsOptions = {
  onEdit: (tag: Tag) => void;
};

const createTagColumns = ({ onEdit }: TagColumnsOptions): ColumnDef<Tag>[] => [
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

export { createTagColumns };
