import React from "react";
import { CLASS_PREFIX } from "conf";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "molecules";

const TablePreview = () => {
  const tableHeaders = [
    { title: "Invoice" }, // style: { textAlign: "center" }  width: "350px"
    { title: "Status" },
    { title: "Method" },
    { title: "Amount" },
  ];
  const tableData = [
    {
      invoice: "INV001",
      paymentStatus: "Paid",
      totalAmount: "$250.00",
      paymentMethod: "Credit Card",
    },
    {
      invoice: "INV002",
      paymentStatus: "Pending",
      totalAmount: "$150.00",
      paymentMethod: "PayPal",
    },
    {
      invoice: "INV003",
      paymentStatus: "Unpaid",
      totalAmount: "$350.00",
      paymentMethod: "Bank Transfer",
    },
    {
      invoice: "INV004",
      paymentStatus: "Paid",
      totalAmount: "$450.00",
      paymentMethod: "Credit Card",
    },
    {
      invoice: "INV005",
      paymentStatus: "Paid",
      totalAmount: "$550.00",
      paymentMethod: "PayPal",
    },
    {
      invoice: "INV006",
      paymentStatus: "Pending",
      totalAmount: "$200.00",
      paymentMethod: "Bank Transfer",
    },
    {
      invoice: "INV007",
      paymentStatus: "Unpaid",
      totalAmount: "$300.00",
      paymentMethod: "Credit Card",
    },
  ];
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {tableHeaders.map((header, index) => (
            <TableHead
              key={index}
              style={{ width: header?.width && header.width, ...header?.style }}
            >
              {header.title}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableData.map((data, index) => (
          <TableRow key={index}>
            <TableCell className={`${CLASS_PREFIX}-table-highlighted-cell`}>
              {data.invoice}
            </TableCell>
            <TableCell>{data.paymentStatus}</TableCell>
            <TableCell>{data.paymentMethod}</TableCell>
            <TableCell>{data.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TablePreview;
