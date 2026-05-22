import React from "react";
import Table from '@/molecules/table/table';
import TableBody from '@/molecules/table/table-body';
import TableHead from '@/molecules/table/table-head';
import TableHeader from '@/molecules/table/table-header';
import TableRow from '@/molecules/table/table-row';
import { useSelector } from "react-redux";
import { __ } from "@/wpi18n";
import SingleRow from './single-row';
import { useState } from "react";
import { allTableHeaders } from "../utils";
import { CLASS_PREFIX } from "@/conf";

const BulkEditTable = ({ selectedFields }) => {
  const { variants } = useSelector((state) => state.bulk?.data);
  const [selectionData, setSelectionData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Table scrollable editMode="multiCell" style={{ minWidth: "100vw" }}>
      <TableHeader>
        <TableRow>
          {allTableHeaders
            .filter((item) => selectedFields.includes(item?.value))
            .map((header, index) => (
              <TableHead
                alignment={header?.alignment}
                key={index}
                className={index === 0 ? `${CLASS_PREFIX}-sticky-cell` : ""}
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
