import { useDataTableContext } from '@/components/data-table/data-table-context';
import { useDataTableSelection } from '@/components/data-table/data-table-selection-context';
import Checkbox from '@/components/ui/checkbox';
import Spinner from '@/components/ui/spinner';
import { TableCell, TableRow } from '@/components/ui/table';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const DataTableBody = () => {
  const { data, columns, isLoading, onRowClick } = useDataTableContext();
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
        <TableRow
          key={item.id}
          onClick={onRowClick ? () => onRowClick(item) : undefined}
          cssOverride={onRowClick ? styles.clickable : undefined}
        >
          <TableCell
            onlyCheckbox
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Checkbox
              value={isRowSelected(item.id)}
              onChange={(value) => onToggleRow(value, item.id)}
            />
          </TableCell>
          {columns.map((column, index) => (
            <TableCell
              key={index}
              alignment={column.alignment}
              cssOverride={
                column.onColumnClick
                  ? { ...styles.clickable, ...column.cssOverride }
                  : column.cssOverride
              }
              onClick={
                column.onColumnClick
                  ? (event) => {
                    event.stopPropagation();
                    column.onColumnClick?.(item);
                  }
                  : undefined
              }
            >
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

const styles = defineStyles({
  clickable: {
    cursor: 'pointer',
  },
});
