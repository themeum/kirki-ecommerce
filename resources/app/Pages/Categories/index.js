import { Card, Container, Flex, PageHeading } from "@/molecules";
import React from "react";
import CategoryTable from "./CategoryTable";
import { useDispatch, useSelector } from "react-redux";
import NewCategory from "./NewCategory";
import { getCategoriesAPI, setKeyValue } from "../../store/categoriesSlice";
import { Pagination } from "@/components";
import { useGetListAPI } from "@/hooks";
import { __ } from "@/wpi18n";

const Categories = () => {
  const dispatch = useDispatch();
  const { loaded, data } = useSelector((state) => state.categories);
  useGetListAPI({ reducerName: "categories", apiCallBack: getCategoriesAPI });
  const handlePaginationChange = (value) => {
    dispatch(setKeyValue({ key: "page", value: value }));
  };

  return (
    <>
      <PageHeading text={__("Categories", "kirki-ecommerce")} actions={<NewCategory />} />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <CategoryTable />
            </Card>
            <Pagination
              data={data}
              onChange={(page) => handlePaginationChange(page)}
            />
          </Flex>
        ) : (
          <div>{__("Loading...", "kirki-ecommerce")}</div>
        )}
      </Container>
    </>
  );
};

export default Categories;
