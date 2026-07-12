import { useState } from 'react';

import { CLASS_PREFIX } from '@/conf';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/molecules/table';
import { useAppSelector } from '@/store/hooks';

import { allTableHeaders } from '../utils';
import SingleRow from './single-row';

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
  const { variants } = useAppSelector((state) => state.bulk?.data)!;
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
                className={index === 0 ? `${CLASS_PREFIX}-sticky-cell` : ''}
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

export default BulkEditTable;

export type { BulkEditSelectionData };
