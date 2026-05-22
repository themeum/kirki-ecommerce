import { Card, Container, Flex, PageHeading } from "@/molecules";
import React from "react";
import BrandTable from "./BrandTable";
import NewBrand from "./NewBrand";
import { Pagination } from "@/components";
import { useDispatch, useSelector } from "react-redux";
import { useGetListAPI } from "@/hooks";
import { getBrandsAPI, setKeyValue } from "../../store/brandsSlice";
import { __ } from "@/wpi18n";

const Brands = () => {
  const dispatch = useDispatch();
  const { loaded, data } = useSelector((state) => state.brands);
  useGetListAPI({ reducerName: "brands", apiCallBack: getBrandsAPI });

  const handlePaginationChange = (value) => {
    dispatch(setKeyValue({ key: "page", value: value }));
  };

  return (
    <>
      <PageHeading text={__("Brands", "kirki-ecommerce")} actions={<NewBrand />} />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <BrandTable />
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

export default Brands;
