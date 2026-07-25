import { useNavigate } from 'react-router';

import Badge from '@/components/ui/badge';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Thumbnail from '@/components/ui/thumbnail';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { MarkListHandlers, ProductListItem } from '@/types';
import { getBadgeVariantForStatus } from '@/utils/badge-status';

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
    <TableRow>
      <TableCell onlyCheckbox>
        <Checkbox
          value={isSelected(item.id)}
          onChange={(value) => handleSingleCheckboxClick(value, item.id)}
        />
      </TableCell>
      <TableCell>
        <Flex gap={3} align="center">
          <Thumbnail src={item?.image ?? undefined} size="small" />
          <span
            css={styles.clickable}
            onClick={() => {
              handleItemClick(item.id);
            }}
          >
            <span css={styles.mutedText}>{item?.title} </span>
          </span>
        </Flex>
      </TableCell>
      <TableCell>{item?.sku || 1236127}</TableCell>
      <TableCell>{item?.inventory}</TableCell>
      <TableCell>{item?.price}</TableCell>
      <TableCell>
        <Badge variant={getBadgeVariantForStatus(item?.status ?? '')}>
          {item?.status}
        </Badge>
      </TableCell>
      <TableCell>{item?.created_at}</TableCell>
    </TableRow>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;

const styles = {
  clickable: scoped({
    cursor: 'pointer',
  }),
  mutedText: scoped({
    color: theme.colors.text.subdued,
  }),
};
