import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/molecules/table';
import Text from '@/molecules/text';
import Thumbnail from '@/molecules/thumbnail';
import type { MediaRef } from '@/types';

const ItemsTable = () => {
  const itemImg: MediaRef[] = [
    {
      id: 1,
      url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/10/thumb-1.png',
    },
    {
      id: 2,
      url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/10/thumb-2.png',
    },
    {
      id: 3,
      url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/10/thumb-3.png',
    },
    {
      id: 4,
      url: 'https://kirki-ecommerce.test/wp-content/uploads/2025/10/thumb.png',
    },
  ];

  return (
    <Table>
      <TableBody>
        {[0, 1, 2, 3].map((item, index) => (
          <TableRow key={index}>
            <TableCell>
              <Flex gap={12}>
                <Flex gap={12} style={{ alignItems: 'center' }}>
                  <Thumbnail src={itemImg[item].url} />
                  <Text header="Hockey Shoes" subHeader="Beige white" />
                </Flex>
              </Flex>
            </TableCell>
            <TableCell alignment="right">
              <div style={{ maxWidth: '154px' }}>
                <Input
                  placeholder="19.99"
                  style={{ textAlign: 'center' }}
                  onChange={(value) => {
                    console.log(value);
                  }}
                  value={19}
                />
              </div>
            </TableCell>
            <TableCell alignment="right">
              <div>$234.00</div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ItemsTable;
