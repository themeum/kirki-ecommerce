import { Flex, Searchbox } from "molecules";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setKeyValue } from "../../../store/brandsSlice";

const BrandTableAction = () => {
  const dispatch = useDispatch();
  const { search } = useSelector((state) => state.brands);
  const handleSearchChange = (value) => {
    dispatch(setKeyValue({ key: "search", value: value }));
  };
  return (
    <Flex style={{ padding: "16px 12px" }}>
      <div style={{ width: "160px" }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value)}
          value={search}
        />
      </div>
    </Flex>
  );
};

export default BrandTableAction;
