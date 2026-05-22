import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import React from "react";
import BrandTable from './brand-table/brand-table';
import NewBrand from './new-brand';
import Pagination from '@/components/pagination';
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
