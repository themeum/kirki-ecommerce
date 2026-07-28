import { useDataTableContext } from '@/components/data-table/data-table-context';
import { useDataTableSelection } from '@/components/data-table/data-table-selection-context';
import Checkbox from '@/components/ui/checkbox';
import Spinner from '@/components/ui/spinner';
import { TableCell, TableRow } from '@/components/ui/table';
import { __ } from '@/wpi18n';

const DataTableBody = () => {
  const { data, columns, isLoading } = useDataTableContext();
  const { isRowSelected, onToggleRow } = useDataTableSelection();

  if (isLoading || !data.results.length) {
    return (
      <TableRow>
        <TableCell colSpan={columns.length + 1} alignment="center">
          {isLoading ? <Spinner /> : __('No items found', 'kirki-ecommerce')}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {data.results.map((item) => (
        <TableRow key={item.id}>
          <TableCell onlyCheckbox>
            <Checkbox
              value={isRowSelected(item.id)}
              onChange={(value) => onToggleRow(value, item.id)}
            />
          </TableCell>
          {columns.map((column, index) => (
            <TableCell key={index} alignment={column.alignment}>
              {column.renderItem(item)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

DataTableBody.displayName = 'DataTableBody';

export default DataTableBody;
