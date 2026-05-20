import React from "react";
import GroupOptionCard from "../components/GroupOptionCard";
import { TruckIcon } from "icons";

const GroupOptionCardPreview = () => {
  const data = [
    {
      name: "Standard Delivery",
      subText: "2-3days",
      icon: <TruckIcon />,
      rightText: "$10",
    },
    {
      name: "Rate by Weight",
      subText: "2-3days",
      icon: <TruckIcon />,
      rightText: "$10",
    },
    {
      name: "Free Shipping",
      subText: "2-3days",
      icon: <TruckIcon />,
      rightText: "$10",
    },
  ];
  return (
    <div>
      <GroupOptionCard
        dataArr={data}
        handleToggleItem={(item) => {
          console.log(item);
        }}
        handleDeleteItem={(item) => {
          console.log(item);
        }}
        handleEditItem={(item) => {
          console.log(item);
        }}
      />
    </div>
  );
};

export default GroupOptionCardPreview;
