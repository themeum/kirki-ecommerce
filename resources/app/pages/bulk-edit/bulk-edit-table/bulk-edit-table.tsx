import { useState } from 'react';

import { useBulkEditForm } from '@/contexts/bulk-edit-form-context';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { allTableHeaders } from '@/pages/bulk-edit/utils';
import SingleRow from '@/pages/bulk-edit/bulk-edit-table/single-row';

type BulkEditSelectionData = {
  fieldName?: string;
  start: number;
  end: number;
  mode?: 'select' | 'fill';
  baseIndex?: number;
  lastIndex?: number;
  grabberIndex?: number;
};

type BulkEditTableProps = {
  selectedFields: string[];
};

const BulkEditTable = ({ selectedFields }: BulkEditTableProps) => {
  const { variants } = useBulkEditForm();
  const [selectionData, setSelectionData] =
    useState<BulkEditSelectionData | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Table scrollable editMode="multiCell" style={{ minWidth: '100vw' }}>
      <TableHeader>
        <TableRow>
          {allTableHeaders
            .filter((item) => selectedFields.includes(item?.value))
            .map((header, index) => (
              <TableHead
                alignment={header?.alignment}
                key={index}
                data-sticky-cell={index === 0 ? 'true' : undefined}
              >
                {header.title}
              </TableHead>
            ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {variants.map((item, index) => (
          <SingleRow
            key={item?.id}
            index={index}
            selectionData={selectionData}
            setSelectionData={setSelectionData}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            selectedFields={selectedFields}
          />
        ))}
      </TableBody>
    </Table>
  );
};

BulkEditTable.displayName = 'BulkEditTable';

export default BulkEditTable;

export type { BulkEditSelectionData };
