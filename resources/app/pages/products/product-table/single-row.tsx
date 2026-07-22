import { useNavigate } from 'react-router';

import Badge from '@/components/ui/badge';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Thumbnail from '@/components/ui/thumbnail';
import type { BadgeType, MarkListHandlers, ProductListItem } from '@/types';

type SingleRowProps = MarkListHandlers & {
  item: ProductListItem;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
}: SingleRowProps) => {
  const navigate = useNavigate();

  const handleItemClick = (id: number) => {
    navigate('/products/' + id);
  };

  return (
    <TableRow key={item.id}>
      <TableCell onlyCheckbox>
        <Checkbox
          value={isSelected(item.id)}
          onChange={(value) => handleSingleCheckboxClick(value, item.id)}
        />
      </TableCell>
      <TableCell>
        <Flex gap={12} style={{ alignItems: 'center' }}>
          <Thumbnail src={item?.image ?? undefined} size="small" />
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => {
              handleItemClick(item.id);
            }}
          >
            <span style={{ color: '#878593' }}>{item?.title} </span>
          </span>
        </Flex>
      </TableCell>
      <TableCell>{item?.sku || 1236127}</TableCell>
      <TableCell>{item?.inventory}</TableCell>
      <TableCell>{item?.price}</TableCell>
      <TableCell>
        <Badge text={item?.status} type={item?.status as BadgeType} />
      </TableCell>
      <TableCell>{item?.created_at}</TableCell>
    </TableRow>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;
