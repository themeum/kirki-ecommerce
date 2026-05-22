import { ArrowDownUpFilled } from "@/icons";
import Flex from '@/molecules/flex';
import React from "react";
import { useDispatch, useSelector } from "react-redux";

const Sorting = ({ data }) => {
  const { title, sortable } = data;
  const { reducer, sort_by, setKeyValue } = sortable || {};
  const dispatch = useDispatch();
  const sort_order = useSelector((state) => state[reducer]?.sort_order);
  const _sort_by = useSelector((state) => state[reducer]?.sort_by);
  const handleSorting = () => {
    if (setKeyValue) {
      if (sort_order === "asc") {
        dispatch(setKeyValue({ key: "sort_order", value: "desc" }));
      } else {
        dispatch(setKeyValue({ key: "sort_order", value: "asc" }));
      }
      dispatch(setKeyValue({ key: "sort_by", value: sort_by }));
    }
  };

  const isActive = () => {
    if (_sort_by === sort_by) {
      return true;
    }
    return false;
  };

  const getArrowColor = (type = "top") => {
    if (
      isActive() &&
      ((type === "top" && sort_order === "desc") ||
        (type === "bottom" && sort_order === "asc"))
    ) {
      return "#5641f3";
    } else {
      return "#5f5d69";
    }
  };

  let styleObj = {};
  if (sortable) {
    if (isActive()) {
      styleObj.color = "#5641f3";
    }
    styleObj.cursor = "pointer";
  }
  return (
    <Flex
      gap={4}
      style={{ alignItems: "center", ...styleObj }}
      onClick={handleSorting}
    >
      {title}
      {sortable && (
        <ArrowDownUpFilled
          top={getArrowColor("top")}
          bottom={getArrowColor("bottom")}
        />
      )}
    </Flex>
  );
};

export default Sorting;
