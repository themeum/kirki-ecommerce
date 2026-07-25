import { useNavigate } from 'react-router';

import { FileSpreadSheetIcon, InfoIcon, StripeIcon } from '@/icons';
import Badge from '@/components/ui/badge';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Text from '@/components/ui/text';
import { flexCenter, scoped } from '@/theme/mixins';
import type { TaxonomyTableHeader } from '@/types';

const OrderTable = () => {
  const navigate = useNavigate();
  const tableHeaders: TaxonomyTableHeader[] = [
    { title: 'Order' },
    { title: 'Quantity' },
    { title: 'Price' },
    { title: 'Status' },
    { title: 'Payment Method' },
    { title: 'Date' },
  ];

  const handleItemClick = (id: number) => {
    navigate('/orders/' + id);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead onlyCheckbox>
            <Checkbox
              value={false}
              onChange={(value) => console.log(value, 'checkbox 1')}
            />
          </TableHead>
          {tableHeaders.map((header, index) => (
            <TableHead key={index}>{header.title}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item, index) => (
          <TableRow
            key={index}
            onClick={() => {
              handleItemClick(item);
            }}
          >
            <TableCell>
              <Checkbox
                value={false}
                onChange={(value) => console.log(value, 'checkbox 1')}
              />
            </TableCell>
            <TableCell>
              <Flex direction="column" gap={1}>
                <Flex gap={1} align="center">
                  <Text variant="small" color="subdued"># 029433</Text>
                  <Badge variant="secondary">Manual Order</Badge>
                </Flex>
                <Text variant="small">by Melanie Martinez</Text>
              </Flex>
            </TableCell>
            <TableCell>
              <Flex gap={2}>
                <span>33</span>
                <span css={styles.svgClass}>
                  <InfoIcon />
                </span>
              </Flex>
            </TableCell>
            <TableCell>
              <Flex gap={1}>
                <span>BDT 4,000</span>
                <span css={styles.svgClass}>
                  <FileSpreadSheetIcon />
                </span>
              </Flex>
            </TableCell>
            <TableCell>
              <Badge variant="warning">Pending</Badge>
            </TableCell>
            <TableCell>
              <Flex gap={3}>
                <span css={styles.svgClass}>
                  <StripeIcon />
                </span>
                <span>Stripe</span>
              </Flex>
            </TableCell>
            <TableCell>2025/04/09</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrderTable;

const styles = {
  svgClass: scoped(flexCenter()),
};
