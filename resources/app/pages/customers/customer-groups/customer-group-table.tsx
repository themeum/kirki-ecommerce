import Badge from '@/components/ui/badge';
import Checkbox from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type GroupTableHeader = {
  title: string;
};

const CustomerGroupTable = () => {
  const tableHeaders: GroupTableHeader[] = [
    { title: 'Group Name' },
    { title: 'Members' },
    { title: 'Tags' },
    { title: 'Created On' },
  ];

  return (
    <Table type="wide">
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
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((_, index) => (
          <TableRow key={index}>
            <TableCell onlyCheckbox>
              <Checkbox
                value={false}
                onChange={(value) => console.log(value, 'checkbox 1')}
              />
            </TableCell>
            <TableCell style={{ width: '50%' }}>Wholesale Partners</TableCell>
            <TableCell>12</TableCell>
            <TableCell>
              <Badge variant="warning">Wholesale</Badge>
            </TableCell>
            <TableCell>2025/04/09</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CustomerGroupTable;
