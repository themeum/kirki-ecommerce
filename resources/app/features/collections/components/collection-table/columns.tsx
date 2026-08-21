import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import type { Collection } from '@/features/collections/schemas/catalog/collection';
import { DATE_FORMATS } from '@/libs/date';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const collectionColumns: ColumnDef<Collection>[] = [
  {
    id: 'title',
    header: __('Collection', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => {
      const banner = row.original?.banner && typeof row.original.banner === 'object' ? row.original.banner : null;
      return (
        <Flex gap={2} align="center">
          <Thumbnail size="small" src={banner?.url} />
          <Text variant="small">{row.original?.title || '--'}</Text>
        </Flex>
      );
    },
  },
  {
    id: 'count',
    header: __('Products', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original?.count ?? 0,
  },
  {
    id: 'created_at',
    header: __('Created at', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => isDefined(row.original.created_at) ? format(row.original.created_at, DATE_FORMATS.HUMAN_READABLE) : '--',
  },
];

export { collectionColumns };
