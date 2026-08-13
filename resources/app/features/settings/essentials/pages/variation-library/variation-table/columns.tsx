import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import Flex from '@/components/ui/flex';
import type { AttributeValue } from '@/features/products';
import { DATE_FORMATS } from '@/libs/date';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type GetVariationColumnsParams = {
  attributeName?: string;
  type?: string;
  updatedAt?: string | null;
};

const getVariationColumns = ({
  attributeName,
  type,
  updatedAt,
}: GetVariationColumnsParams): ColumnDef<AttributeValue>[] => {
  const columns: ColumnDef<AttributeValue>[] = [
    {
      id: 'value',
      header: attributeName ?? '',
      enableSorting: false,
      cell: ({ row }) => (
        <Flex gap={3} align="center">
          {type === 'color' && (
            <div
              css={scoped({
                height: 32,
                width: 32,
                minWidth: 32,
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border.default}`,
                backgroundColor: `${row.original?.color ?? 'transparent'}`,
              })}
            />
          )}
          {row.original?.value}
        </Flex>
      ),
    },
  ];

  if (type === 'color') {
    columns.push({
      id: 'color',
      header: __('Hex code', 'kirki-ecommerce'),
      enableSorting: false,
      cell: ({ row }) => row.original?.color,
    });
  }

  columns.push({
    id: 'updated_at',
    header: __('Updated', 'kirki-ecommerce'),
    enableSorting: false,
    cell: () => (updatedAt ? format(updatedAt, DATE_FORMATS.HUMAN_READABLE) : '--'),
  });

  return columns;
};

export { getVariationColumns };
