import React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "molecules/table";
import { useSelector } from "react-redux";
import { __ } from "wpi18n";
import SingleRow from "./SingleRow";
import { useState } from "react";
import { allTableHeaders } from "../utils";
import { CLASS_PREFIX } from "conf";

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
